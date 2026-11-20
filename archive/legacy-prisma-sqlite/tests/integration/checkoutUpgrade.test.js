import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('../../scripts/upgrade-checkout.mjs', import.meta.url));
function legacyFixture() {
  const directory = mkdtempSync(join(tmpdir(), 'riderent-checkout-upgrade-'));
  const filename = join(directory, 'checkout-fixture.sqlite');
  const db = new DatabaseSync(filename);
  db.exec(
    "CREATE TABLE vehicles(id TEXT PRIMARY KEY, rate INTEGER); CREATE TABLE bookings(id TEXT PRIMARY KEY); CREATE TABLE settings(id INTEGER PRIMARY KEY,data TEXT); INSERT INTO vehicles VALUES('old-vehicle',12000); INSERT INTO bookings VALUES('old-booking'); INSERT INTO settings VALUES(1,'{}');",
  );
  db.close();
  return {
    filename,
    cleanup() {
      unlinkSync(filename);
      rmdirSync(directory);
    },
  };
}
const execute = (filename) =>
  spawnSync(process.execPath, [script, '--database', filename], { encoding: 'utf8' });

test('checkout upgrade preserves existing rows, adds both dependencies and is safely repeatable', () => {
  const fixture = legacyFixture();
  try {
    const result = execute(fixture.filename);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /backup:/);
    assert.match(result.stdout, /row hashes unchanged/);
    const db = new DatabaseSync(fixture.filename, { readOnly: true });
    try {
      assert.equal(db.prepare('SELECT rate FROM vehicles').get().rate, 12000);
      assert.equal(db.prepare('SELECT id FROM bookings').get().id, 'old-booking');
      for (const name of [
        'checkout_orders',
        'checkout_items',
        'booking_addons',
        'addons',
        'addon_categories',
        'addon_allocations',
      ])
        assert.ok(
          db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name),
        );
      assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
    } finally {
      db.close();
    }
    const repeated = execute(fixture.filename);
    assert.equal(repeated.status, 0, repeated.stderr);
    assert.match(repeated.stdout, /No changes made/);
  } finally {
    fixture.cleanup();
  }
});

test('checkout upgrade refuses partial installations without modifying the remaining schema', () => {
  const fixture = legacyFixture();
  try {
    const db = new DatabaseSync(fixture.filename);
    db.exec('CREATE TABLE checkout_orders(id TEXT PRIMARY KEY)');
    db.close();
    const result = execute(fixture.filename);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Partial 0006_checkout_orders/);
    const check = new DatabaseSync(fixture.filename, { readOnly: true });
    try {
      assert.equal(check.prepare('SELECT COUNT(*) count FROM bookings').get().count, 1);
      assert.equal(
        check.prepare("SELECT COUNT(*) count FROM sqlite_master WHERE name='addons'").get().count,
        0,
      );
    } finally {
      check.close();
    }
  } finally {
    fixture.cleanup();
  }
});
