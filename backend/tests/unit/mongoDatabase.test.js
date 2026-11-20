import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openMongoDb, queryGroup, withTransaction } from '../../src/config/mongoDatabase.js';
import {
  insertBooking,
  insertBookingContact,
  insertCustomer,
} from '../../src/modules/bookings/booking.repository.js';

function createDatabase() {
  const calls = [];
  const session = {
    async withTransaction(callback) {
      return callback();
    },
    async endSession() {},
  };
  return {
    calls,
    session,
    client: { startSession: () => session },
    db: {
      collection: (name) => ({
        updateOne: async (_filter, _update, options) => {
          calls.push({ type: 'update', name, session: options?.session });
        },
        insertOne: async (_document, options) => {
          calls.push({ type: 'insert', name, session: options?.session });
        },
      }),
    },
  };
}

test('queryGroup sequences operations while a Mongo transaction session is active', async () => {
  const database = createDatabase();
  let active = 0;
  let peakActive = 0;

  await withTransaction(database, async () => {
    const results = await queryGroup(database, [
      async () => {
        active += 1;
        peakActive = Math.max(peakActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return 'first';
      },
      async () => {
        active += 1;
        peakActive = Math.max(peakActive, active);
        active -= 1;
        return 'second';
      },
    ]);

    assert.deepEqual(results, ['first', 'second']);
    assert.equal(peakActive, 1);
  });

  assert.deepEqual(database.calls, [
    { type: 'update', name: 'system_locks', session: database.session },
  ]);
});

test('queryGroup keeps independent reads parallel outside a transaction', async () => {
  const database = createDatabase();
  let active = 0;
  let peakActive = 0;

  const results = await queryGroup(database, [
    async () => {
      active += 1;
      peakActive = Math.max(peakActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return 'first';
    },
    async () => {
      active += 1;
      peakActive = Math.max(peakActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return 'second';
    },
  ]);

  assert.deepEqual(results, ['first', 'second']);
  assert.equal(peakActive, 2);
});

test('MongoDB startup reports a missing URI and never falls back to SQLite', async () => {
  await assert.rejects(
    () => openMongoDb({ uri: '' }),
    /MONGODB_URI is required to start the MongoDB backend\./,
  );
});

test('booking records and contact snapshots use the same active Mongo transaction session', async () => {
  const database = createDatabase();

  await withTransaction(database, async () => {
    await insertCustomer(
      database,
      'customer-1',
      'Test Rider',
      '9876500001',
      'rider@example.test',
      0,
      '2026-11-12T00:00:00.000Z',
    );
    await insertBooking(
      database,
      'booking-1',
      'RR-TEST000001',
      'access-hash',
      'customer-1',
      'vehicle-1',
      '2026-11-13T10:00:00.000Z',
      '2026-11-13T12:00:00.000Z',
      2,
      8500,
      17000,
      0,
      0,
      0,
      'confirmed',
      'Website',
      '',
      '2026-11-12T00:00:00.000Z',
    );
    await insertBookingContact(
      database,
      'booking-1',
      'Test Rider',
      '9876500001',
      'rider@example.test',
      0,
    );
  });

  const writes = database.calls.filter((call) => call.type === 'insert');
  assert.deepEqual(
    writes.map(({ name, session }) => ({ name, session })),
    [
      { name: 'customers', session: database.session },
      { name: 'bookings', session: database.session },
      { name: 'booking_contacts', session: database.session },
    ],
  );
});
