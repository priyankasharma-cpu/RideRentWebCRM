import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolveProjectPath } from '../src/config/paths.js';
import { prismaCommand } from './prisma.mjs';

const argument = process.argv.indexOf('--database');
if (argument < 0 || !process.argv[argument + 1])
  throw new Error('Specify --database path/to/existing.sqlite. Take a backup first.');
const file = resolveProjectPath(process.argv[argument + 1]);
if (!existsSync(file))
  throw new Error('Existing database not found. Baselining never creates or resets a database.');

function inspect() {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const violations = db.prepare('PRAGMA foreign_key_check').all();
    if (violations.length) throw new Error('Resolve foreign-key violations before baselining.');
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name",
      )
      .all();
    const snapshot = {};
    for (const { name } of tables) {
      if (!/^[a-z_]+$/.test(name))
        throw new Error('Unexpected table name. Review this database manually.');
      const rows = db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all();
      if (
        rows.some(
          (row) => row.id === null || (name === 'booking_contacts' && row.booking_id === null),
        )
      )
        throw new Error(`Null identifiers in ${name}. Review before migration.`);
      snapshot[name] = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
    }
    return snapshot;
  } finally {
    db.close();
  }
}

const before = inspect();
if (Object.keys(before).length !== 13)
  throw new Error('Expected the 13-table RideRent schema. Do not baseline an unknown schema.');
const url = `file:${file.replaceAll('\\', '/')}`;
const db = new DatabaseSync(file, { readOnly: true });
const tracked = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'")
  .get();
db.close();
if (!tracked) await prismaCommand(['migrate', 'resolve', '--applied', '0001_baseline'], url);
await prismaCommand(['migrate', 'deploy'], url);
if (JSON.stringify(before) !== JSON.stringify(inspect()))
  throw new Error('Business rows changed unexpectedly. Stop and inspect the backup.');
console.log(
  'Baseline and additive identifier guards applied. All business row hashes are unchanged.',
);
