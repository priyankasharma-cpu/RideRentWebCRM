import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { env } from '../../../backend/src/config/env.js';
import { resolveProjectPath } from '../../../backend/src/config/paths.js';
import { configureMongoDns } from '../../../backend/src/config/mongoDns.js';

const requireBackend = createRequire(
  new URL('../../../backend/package.json', import.meta.url),
);
const { MongoClient } = requireBackend('mongodb');

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function safeJsonValue(value) {
  if (typeof value === 'bigint') {
    const number = Number(value);
    if (!Number.isSafeInteger(number)) {
      throw new Error(
        'A SQLite integer exceeds JavaScript safe precision; migration stopped to avoid changing it.',
      );
    }
    return number;
  }
  if (Buffer.isBuffer(value)) return { $binaryBase64: value.toString('base64') };
  if (Array.isArray(value)) return value.map(safeJsonValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, safeJsonValue(item)]),
    );
  }
  return value;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => key !== '_id' && key !== '_migration_order')
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return safeJsonValue(value);
}

function digest(value) {
  return createHash('sha256')
    .update(JSON.stringify(stableValue(value)))
    .digest('hex');
}

function loadSource(filename) {
  const sqlite = new DatabaseSync(filename, { readOnly: true });
  try {
    sqlite.exec('PRAGMA query_only=ON');
    const integrity = sqlite.prepare('PRAGMA integrity_check').get().integrity_check;
    const violations = sqlite.prepare('PRAGMA foreign_key_check').all();
    if (integrity !== 'ok' || violations.length) {
      throw new Error('Source backup failed SQLite integrity or relationship checks.');
    }

    const tableNames = sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map(({ name }) => name);

    return tableNames.map((table) => {
      const columns = sqlite.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`).all();
      const primaryKeys = columns.filter(({ pk }) => pk > 0).sort((a, b) => a.pk - b.pk);
      if (!primaryKeys.length) throw new Error(`Table ${table} has no stable primary key.`);
      const statement = sqlite.prepare(`SELECT * FROM ${quoteIdentifier(table)} ORDER BY rowid`);
      statement.setReadBigInts(true);
      const rows = statement.all().map((row) => safeJsonValue(row));
      const documents = rows.map((row, rowIndex) => {
        const keyValues = primaryKeys.map(({ name }) => row[name]);
        if (keyValues.some((value) => value === null || value === undefined)) {
          throw new Error(`Table ${table} contains a null primary key.`);
        }
        const mongoId =
          keyValues.length === 1
            ? keyValues[0]
            : `${table}:${keyValues.map((value) => encodeURIComponent(String(value))).join(':')}`;
        return {
          _id: mongoId,
          ...row,
          ...(table === 'checkout_items' ? { _migration_order: rowIndex } : {}),
        };
      });
      documents.sort((left, right) => String(left._id).localeCompare(String(right._id)));
      return {
        table,
        primaryKeys: primaryKeys.map(({ name }) => name),
        rows,
        documents,
        sourceHash: digest(documents),
      };
    });
  } finally {
    sqlite.close();
  }
}

async function inspectTarget(db, tables) {
  const expected = new Map(tables.map((table) => [table.table, table]));
  const names = await db.listCollections({}, { nameOnly: true }).toArray();
  for (const { name } of names) {
    const count = await db.collection(name).countDocuments({});
    if (name === 'system_locks' && count === 1) {
      const lock = await db.collection(name).findOne({ _id: 'riderent-write-queue' });
      if (lock && Number.isSafeInteger(lock.version)) continue;
    }
    if (count > 0 && !expected.has(name)) {
      throw new Error(
        `Unexpected non-empty target collection ${name}; refusing to import into this database.`,
      );
    }
  }

  const missingByTable = new Map();
  for (const table of tables) {
    const existing = await db.collection(table.table).find({}).toArray();
    const sourceById = new Map(table.documents.map((document) => [String(document._id), document]));
    for (const document of existing) {
      const sourceDocument = sourceById.get(String(document._id));
      if (!sourceDocument || digest(document) !== digest(sourceDocument)) {
        throw new Error(
          `Target collection ${table.table} has a conflicting record; no records were overwritten.`,
        );
      }
      sourceById.delete(String(document._id));
    }
    missingByTable.set(table.table, [...sourceById.values()]);
  }
  return missingByTable;
}

async function writeTable(db, table, documents) {
  if (!documents.length) return;
  const collection = db.collection(table.table);
  for (let start = 0; start < documents.length; start += 500) {
    await collection.insertMany(documents.slice(start, start + 500), { ordered: true });
  }
}

async function verifyTable(db, table) {
  const collection = db.collection(table.table);
  const count = await collection.countDocuments({});
  if (count !== table.rows.length) {
    throw new Error(
      `Reconciliation failed for ${table.table}: expected ${table.rows.length} records, found ${count}.`,
    );
  }
  const docs = await collection.find({}).toArray();
  docs.sort((left, right) => String(left._id).localeCompare(String(right._id)));
  if (digest(docs) !== table.sourceHash) {
    throw new Error(`Reconciliation hash mismatch for ${table.table}.`);
  }
  return { collection: table.table, count, sha256: table.sourceHash };
}

const sqliteFile = argument('--sqlite');
const targetName = argument('--target');
const reportFile = argument('--report');
const allowBusinessTarget = process.argv.includes('--confirm-riderent-target');
const validateOnly = process.argv.includes('--validate-only');

if (!sqliteFile || (!targetName && !validateOnly)) {
  throw new Error(
    'Usage: npm run db:migrate:mongodb -- --sqlite <verified-backup.sqlite> --target riderent_rehearsal [--report <file>] (or use --validate-only to check just the backup)',
  );
}
if (!validateOnly && targetName === 'riderent' && !allowBusinessTarget) {
  throw new Error(
    'The riderent business database requires the explicit --confirm-riderent-target flag.',
  );
}
const source = resolveProjectPath(sqliteFile);
const tables = loadSource(source);
const prismaSchema = await readFile(
  resolveProjectPath('archive/legacy-prisma-sqlite/prisma/schema.prisma'),
  'utf8',
);
const expectedCollections = [
  ...new Set([...prismaSchema.matchAll(/@@map\("([^"]+)"\)/g)].map((match) => match[1])),
].sort();
const sourceCollections = new Set(tables.map(({ table }) => table));
const collectionsAbsentInSource = expectedCollections.filter(
  (name) => !sourceCollections.has(name),
);
if (validateOnly) {
  console.log(
    JSON.stringify(
      {
        source: 'verified SQLite backup',
        status: 'valid',
        collectionCount: tables.length,
        totalRecords: tables.reduce((count, table) => count + table.rows.length, 0),
        collectionsAbsentInSource,
        collections: tables.map(({ table, rows }) => ({ collection: table, count: rows.length })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
if (!env.MONGODB_URI)
  throw new Error('Set MONGODB_URI in backend/.env; do not pass credentials on the command line.');

configureMongoDns();
const client = new MongoClient(env.MONGODB_URI, {
  appName: 'RideRent-migration',
  serverSelectionTimeoutMS: 10_000,
});

try {
  await client.connect();
  const db = client.db(targetName);
  await db.command({ ping: 1 });
  const missingByTable = await inspectTarget(db, tables);

  for (const table of tables) await writeTable(db, table, missingByTable.get(table.table));
  const collections = [];
  for (const table of tables) collections.push(await verifyTable(db, table));

  const report = {
    source: 'verified SQLite backup',
    targetDatabase: targetName,
    status: 'reconciled',
    collectionCount: collections.length,
    totalRecords: collections.reduce((total, item) => total + item.count, 0),
    collectionsAbsentInSource,
    collections,
  };
  if (reportFile) {
    const output = resolveProjectPath(reportFile);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    report.reportFile = output;
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  await client.close();
}
