import { DatabaseSync, backup } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { resolveProjectPath } from '../src/config/paths.js';

const argument = process.argv.indexOf('--database');
if (argument < 0 || !process.argv[argument + 1])
  throw Error('Specify --database path/to/existing.sqlite. This command never creates a database.');
const filename = resolveProjectPath(process.argv[argument + 1]);
if (!existsSync(filename)) throw Error('Existing database not found.');

const upgrades = [
  { name: '0006_checkout_orders', tables: ['checkout_orders', 'checkout_items', 'booking_addons'] },
  { name: '0007_dynamic_addons', tables: ['addons', 'addon_categories', 'addon_allocations'] },
];
const db = new DatabaseSync(filename);
function tableNames() {
  return db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all()
    .map((row) => row.name);
}
function snapshot(tables) {
  return Object.fromEntries(
    tables.map((name) => {
      if (!/^[a-z_]+$/.test(name))
        throw Error('Unexpected table name; review the schema manually.');
      const statement = db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`);
      statement.setReadBigInts(true);
      const data = JSON.stringify(statement.all(), (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return [name, createHash('sha256').update(data).digest('hex')];
    }),
  );
}
try {
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=10000;');
  const names = tableNames();
  if (!['vehicles', 'bookings', 'settings'].every((name) => names.includes(name)))
    throw Error('This is not the expected existing RideRent database.');
  if (db.prepare('PRAGMA foreign_key_check').all().length)
    throw Error('Existing foreign-key violations must be reviewed before upgrading.');
  const pending = upgrades.filter((upgrade) => {
    const count = upgrade.tables.filter((name) => names.includes(name)).length;
    if (count && count !== upgrade.tables.length)
      throw Error(`Partial ${upgrade.name} installation detected. Review it manually.`);
    return count === 0;
  });
  if (!pending.length) {
    console.log('Checkout and add-on tables are already installed. No changes made.');
  } else {
    const directory = resolveProjectPath('backend/.artifacts/backups');
    mkdirSync(directory, { recursive: true });
    const backupFile = `${directory}/${basename(filename)}-${new Date().toISOString().replaceAll(':', '-')}-${randomUUID().slice(0, 8)}.sqlite`;
    await backup(db, backupFile);
    console.log('SQLite-consistent backup:', backupFile);
    db.exec('BEGIN IMMEDIATE');
    try {
      const existingTables = tableNames();
      const before = snapshot(existingTables);
      for (const upgrade of pending) {
        // Recheck after acquiring the write lock, before applying additive DDL.
        if (upgrade.tables.some((name) => tableNames().includes(name)))
          throw Error('Schema changed concurrently. Rerun after reviewing the other upgrade.');
        const sql = readFileSync(
          new URL(`../prisma/migrations/${upgrade.name}/migration.sql`, import.meta.url),
          'utf8',
        );
        db.exec(sql);
      }
      if (JSON.stringify(before) !== JSON.stringify(snapshot(existingTables)))
        throw Error('Existing rows changed unexpectedly; upgrade rolled back.');
      if (db.prepare('PRAGMA foreign_key_check').all().length)
        throw Error('Foreign-key verification failed; upgrade rolled back.');
      db.exec('COMMIT');
      console.log('Installed:', pending.map((upgrade) => upgrade.name).join(', '));
      console.log('All pre-existing table row hashes unchanged; foreign keys valid.');
      console.log('This targeted repair does not reconcile Prisma migration history.');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
} finally {
  db.close();
}
