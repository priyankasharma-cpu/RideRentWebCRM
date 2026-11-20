import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp } from '../../src/app.js';
import { openDb } from '../../src/config/database.js';

let database;
let server;
let baseUrl;

before(async () => {
  database = await openDb(':memory:');
  server = createApp(database).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (database) await database.close();
});

test('liveness endpoint responds without exposing application details', async () => {
  const response = await fetch(`${baseUrl}/healthz`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('readiness checks database and persistent upload directory access', async () => {
  const response = await fetch(`${baseUrl}/readyz`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { status: 'ready' });
});
