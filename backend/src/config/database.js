import { readdirSync } from 'node:fs';
import { AsyncLocalStorage } from 'node:async_hooks';
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { PrismaClient } from '../../generated/client/index.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { databasePath } from './databasePath.js';
import { resolveProjectPath } from './paths.js';
import { id } from '../utils/crypto.js';
const transactions = new AsyncLocalStorage();
const writeQueues = new Map();
async function withWriteLock(database, callback) {
  const key = process.platform === 'win32' ? database.filename.toLowerCase() : database.filename;
  const previous = writeQueues.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const queue = previous.then(() => current);
  writeQueues.set(key, queue);
  await previous;
  try {
    return await callback();
  } finally {
    release();
    if (writeQueues.get(key) === queue) writeQueues.delete(key);
  }
}
export function normalizeRecord(value) {
  if (typeof value === 'bigint') {
    const number = Number(value);
    if (!Number.isSafeInteger(number))
      throw new Error('Database integer exceeds safe JSON precision.');
    return number;
  }
  if (Array.isArray(value)) return value.map(normalizeRecord);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
        normalizeRecord(item),
      ]),
    );
  }
  return value;
}
export const orm = (database) => {
  const active = transactions.getStore();
  return active?.database === database ? active.client : database.prisma;
};
export async function openDb(
  filename = databasePath(),
  { initialize = false, queryObserver } = {},
) {
  const disposable = filename === ':memory:';
  const absolute = resolveProjectPath(
    disposable ? `backend/.artifacts/test-databases/${id()}.sqlite` : filename,
  );
  if (!existsSync(absolute)) {
    if (!initialize && !disposable)
      throw new Error('Database not found. Run npm run setup explicitly.');
    mkdirSync(dirname(absolute), {
      recursive: true,
    });
    const { DatabaseSync } = await import('node:sqlite');
    const connection = new DatabaseSync(absolute);
    const directory = new URL('../../prisma/migrations/', import.meta.url);
    for (const entry of readdirSync(directory, { withFileTypes: true })
      .filter((item) => item.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))) {
      connection.exec(readFileSync(new URL(entry.name + '/migration.sql', directory), 'utf8'));
    }
    connection.close();
  }
  const adapter = new PrismaBetterSqlite3({
    url: `file:${absolute}`,
  });
  const prisma = new PrismaClient({
    adapter,
    ...(queryObserver
      ? {
          log: [
            {
              emit: 'event',
              level: 'query',
            },
          ],
        }
      : {}),
  });
  if (queryObserver) prisma.$on('query', queryObserver);
  await prisma.$connect();
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys=ON');
  await prisma.$queryRawUnsafe('PRAGMA busy_timeout=5000');
  return {
    prisma,
    filename: absolute,
    async close() {
      await prisma.$disconnect();
      if (disposable) {
        for (const suffix of ['', '-wal', '-shm']) {
          const file = absolute + suffix;
          if (existsSync(file)) unlinkSync(file);
        }
      }
    },
  };
}
export async function all(database, sql, ...parameters) {
  return normalizeRecord(await orm(database).$queryRawUnsafe(sql, ...parameters));
}
export async function get(database, sql, ...parameters) {
  return (await all(database, sql, ...parameters))[0];
}
export async function run(database, sql, ...parameters) {
  const execute = () => orm(database).$executeRawUnsafe(sql, ...parameters);
  if (transactions.getStore()?.database === database) return execute();
  return withWriteLock(database, execute);
}
export async function findRecord(database, model, field, value) {
  const record = await orm(database)[model].findUnique({
    where: {
      [field]: value,
    },
  });
  return record ? normalizeRecord(record) : undefined;
}
export async function transaction(database, callback) {
  if (transactions.getStore()?.database === database) return callback();
  return withWriteLock(database, () =>
    database.prisma.$transaction(
      async (client) => {
        // Acquire SQLite's write lock before reading availability. Values remain unchanged.
        await client.$executeRawUnsafe('UPDATE settings SET id=id WHERE id=1');
        return transactions.run(
          {
            database,
            client,
          },
          callback,
        );
      },
      {
        maxWait: 10_000,
        timeout: 20_000,
      },
    ),
  );
}
