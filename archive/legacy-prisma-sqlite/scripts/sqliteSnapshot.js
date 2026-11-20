import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { closeSync, existsSync, mkdirSync, openSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { backup, DatabaseSync } from 'node:sqlite';

function inspectDatabase(filename) {
  const db = new DatabaseSync(filename, { readOnly: true });
  try {
    db.exec('PRAGMA query_only=ON');
    const integrity = db.prepare('PRAGMA integrity_check').get().integrity_check;
    const foreignKeyViolations = db.prepare('PRAGMA foreign_key_check').all().length;
    if (integrity !== 'ok') throw new Error('SQLite integrity check failed.');
    if (foreignKeyViolations) throw new Error('SQLite foreign-key check failed.');

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map(({ name }) => name);
    const tableHashes = {};
    for (const name of tables) {
      const escapedName = name.replaceAll('"', '""');
      const rows = db.prepare(`SELECT * FROM "${escapedName}" ORDER BY rowid`).all();
      tableHashes[name] = {
        count: rows.length,
        sha256: createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
      };
    }
    const schemaRows = db
      .prepare(
        "SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
      )
      .all();
    const schemaHash = createHash('sha256').update(JSON.stringify(schemaRows)).digest('hex');
    return { tableHashes, tableCount: tables.length, schemaHash };
  } finally {
    db.close();
  }
}

function hashFile(filename) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash('sha256');
    const input = createReadStream(filename);
    input.on('error', reject);
    input.on('data', (chunk) => hash.update(chunk));
    input.on('end', () => resolveHash(hash.digest('hex')));
  });
}

export async function createVerifiedSQLiteCopy(sourcePath, destinationPath) {
  const source = resolve(sourcePath);
  const destination = resolve(destinationPath);
  if (source === destination) throw new Error('Source and destination must be different files.');
  if (!existsSync(source)) throw new Error('Source SQLite database does not exist.');
  mkdirSync(dirname(destination), { recursive: true });
  let reservation;
  try {
    reservation = openSync(destination, 'wx');
    closeSync(reservation);
  } catch (error) {
    if (error.code === 'EEXIST')
      throw new Error('Destination already exists; refusing to overwrite it.');
    throw error;
  }

  try {
    const before = inspectDatabase(source);
    const sourceDb = new DatabaseSync(source, { readOnly: true });
    try {
      dbQueryOnly(sourceDb);
      await backup(sourceDb, destination);
    } finally {
      sourceDb.close();
    }
    const after = inspectDatabase(destination);
    if (JSON.stringify(before) !== JSON.stringify(after))
      throw new Error('Snapshot verification failed: table counts or row hashes differ.');

    return {
      source,
      destination,
      tableCount: after.tableCount,
      tableHashes: after.tableHashes,
      sha256: await hashFile(destination),
    };
  } catch (error) {
    if (existsSync(destination)) unlinkSync(destination);
    throw error;
  }
}

function dbQueryOnly(db) {
  db.exec('PRAGMA query_only=ON');
}
