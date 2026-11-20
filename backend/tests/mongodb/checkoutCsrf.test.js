import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { after, before, test } from 'node:test';
import { env } from '../../src/config/env.js';
import { openMongoDb } from '../../src/config/mongoDatabase.js';
import { createApp } from '../../src/app.js';

const databaseName = `riderent_test_${randomBytes(12).toString('hex')}`;
const devOrigin = 'http://localhost:5174';
let database;
let server;
let baseUrl;

before(async () => {
  if (env.NODE_ENV === 'production') {
    throw new Error('Checkout CSRF integration tests must not run in production.');
  }
  if (!env.MONGODB_URI) throw new Error('MongoDB integration tests require MONGODB_URI.');

  database = await openMongoDb({ uri: env.MONGODB_URI, databaseName });
  server = createApp(database, { origins: ['http://localhost:5173'] }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server)
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  if (!database) return;
  try {
    assert.match(databaseName, /^riderent_test_[a-f0-9]+$/);
    await database.db.dropDatabase();
  } finally {
    await database.close();
  }
});

test('checkout quote from Vite port 5174 passes CSRF origin checks with its session token', async () => {
  const sessionResponse = await fetch(`${baseUrl}/api/session`, {
    headers: { Origin: devOrigin },
  });
  assert.equal(sessionResponse.status, 200);
  const { csrf } = await sessionResponse.json();
  const cookie = sessionResponse.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie);

  const quoteResponse = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: 'POST',
    headers: {
      Origin: devOrigin,
      Cookie: cookie,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
    },
    body: JSON.stringify({}),
  });
  const quoteError = await quoteResponse.json();

  assert.equal(quoteResponse.status, 400);
  assert.notEqual(quoteResponse.status, 403);
  assert.match(quoteError.error, /startsAt|endsAt|items/);

  const rejectedOriginResponse = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: 'POST',
    headers: {
      Origin: 'https://untrusted.example',
      Cookie: cookie,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
    },
    body: JSON.stringify({}),
  });
  assert.equal(rejectedOriginResponse.status, 403);
  assert.deepEqual(await rejectedOriginResponse.json(), {
    error: 'Request origin is not allowed.',
  });
});
