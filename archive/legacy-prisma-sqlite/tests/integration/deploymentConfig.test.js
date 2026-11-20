import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { after, before, test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createVerifiedSQLiteCopy } from '../../scripts/sqliteSnapshot.js';

let directory;
let source;
let backup;
let restored;

before(() => {
  directory = mkdtempSync(join(tmpdir(), 'riderent-deploy-test-'));
  source = join(directory, 'source.sqlite');
  backup = join(directory, 'backup.sqlite');
  restored = join(directory, 'restored.sqlite');
  const db = new DatabaseSync(source);
  db.exec('CREATE TABLE business_records (id TEXT PRIMARY KEY, value TEXT NOT NULL)');
  db.prepare('INSERT INTO business_records (id, value) VALUES (?, ?)').run('keep-1', 'preserved');
  db.close();
});

after(() => {
  rmSync(directory, { recursive: true, force: true });
});

test('backup and restore create verified copies without overwriting existing files', async () => {
  const backupResult = await createVerifiedSQLiteCopy(source, backup);
  const restoreResult = await createVerifiedSQLiteCopy(backup, restored);

  assert.equal(backupResult.tableHashes.business_records.count, 1);
  assert.equal(
    restoreResult.tableHashes.business_records.sha256,
    backupResult.tableHashes.business_records.sha256,
  );
  await assert.rejects(createVerifiedSQLiteCopy(source, backup), /refusing to overwrite/);

  const db = new DatabaseSync(source, { readOnly: true });
  try {
    assert.equal(
      db.prepare('SELECT value FROM business_records WHERE id = ?').get('keep-1').value,
      'preserved',
    );
  } finally {
    db.close();
  }
});
