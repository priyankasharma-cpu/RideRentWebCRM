import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { openDb, get } from '../../src/config/database.js';
import { seed } from '../../prisma/seed.js';
import { createBooking, getBooking } from '../../src/modules/bookings/booking.service.js';
import { createApp } from '../../src/app.js';
import {
  requestBookingOtp,
  verifyBookingOtp,
  getCustomerAccessSession,
} from '../../src/modules/bookings/customerAccess.service.js';

const futureWindow = (offsetHours = 36) => ({
  startsAt: new Date(Date.now() + offsetHours * 3_600_000).toISOString(),
  endsAt: new Date(Date.now() + (offsetHours + 4) * 3_600_000).toISOString(),
});

test('OTP request and verification HTTP endpoints apply their own IP rate limits', async () => {
  process.env.ADMIN_EMAIL = 'customer-access-rate@riderent.local';
  process.env.ADMIN_PASSWORD = randomBytes(24).toString('hex');
  const db = await openDb(':memory:');
  const origins = [];
  const server = createApp(db, { origins, otpDelivery: async () => {} }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  origins.push(base);
  try {
    await seed(db);
    const vehicle = await get(
      db,
      "SELECT * FROM vehicles WHERE category='Bike' AND status='Available' LIMIT 1",
    );
    const booking = await createBooking(db, {
      ...futureWindow(),
      vehicleId: vehicle.id,
      name: 'Rate Limit Rider',
      phone: '9876500042',
      email: 'rate-limit@example.com',
      agreement: true,
    });
    const sessionResponse = await fetch(`${base}/api/session`);
    const session = await sessionResponse.json();
    const cookie = sessionResponse.headers.get('set-cookie').split(';')[0];
    const post = (path, body) =>
      fetch(`${base}/api/bookings/${path}`, {
        method: 'POST',
        headers: {
          Cookie: cookie,
          Origin: base,
          'Content-Type': 'application/json',
          'X-CSRF-Token': session.csrf,
        },
        body: JSON.stringify(body),
      });
    const requestBody = { reference: booking.booking.reference, email: 'rate-limit@example.com' };
    const requestResponses = [];
    for (let i = 0; i < 6; i++)
      requestResponses.push(
        await post('access/request', { ...requestBody, reference: `RR-UNKNOWN-${i}` }),
      );
    assert.deepEqual(
      requestResponses.map((response) => response.status),
      [202, 202, 202, 202, 202, 429],
    );

    const verifyResponses = [];
    for (let i = 0; i < 11; i++)
      verifyResponses.push(
        await post('access/verify', { challengeId: randomUUID(), code: '123456' }),
      );
    assert.equal(
      verifyResponses.slice(0, 10).every((response) => response.status === 400),
      true,
    );
    assert.equal(verifyResponses[10].status, 429);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await db.close();
  }
});

test('email OTP is non-enumerating, hashed, single-use, expiring and scoped to verified booking', async () => {
  process.env.ADMIN_EMAIL = 'customer-access@riderent.local';
  process.env.ADMIN_PASSWORD = randomBytes(24).toString('hex');
  const db = await openDb(':memory:');
  try {
    await seed(db);
    const vehicle = await get(
      db,
      "SELECT * FROM vehicles WHERE category='Bike' AND status='Available' LIMIT 1",
    );
    const owner = {
      name: 'OTP Owner',
      phone: '9876500041',
      email: 'otp-owner@example.com',
      agreement: true,
    };
    const first = await createBooking(db, { ...futureWindow(), ...owner, vehicleId: vehicle.id });
    const laterVehicle = await get(
      db,
      "SELECT * FROM vehicles WHERE category='Car' AND status='Available' LIMIT 1",
    );
    const later = await createBooking(db, {
      ...futureWindow(96),
      ...owner,
      vehicleId: laterVehicle.id,
    });
    let delivered;
    const deliver = async (message) => {
      delivered = message;
    };

    const unknown = await requestBookingOtp(
      db,
      { reference: first.booking.reference, email: 'other@example.com' },
      { deliver },
    );
    const requested = await requestBookingOtp(
      db,
      { reference: first.booking.reference, email: owner.email },
      { deliver },
    );
    assert.equal(unknown.message, requested.message);
    assert.equal(unknown.expiresInSeconds, 600);
    assert.equal(delivered.email, owner.email);
    assert.equal(
      (
        await get(
          db,
          'SELECT booking_id FROM booking_access_challenges WHERE id=?',
          unknown.challengeId,
        )
      ).booking_id,
      null,
    );
    const challenge = await get(
      db,
      'SELECT * FROM booking_access_challenges WHERE id=?',
      requested.challengeId,
    );
    assert.match(challenge.otp_hash, /^[a-f0-9]{64}$/);
    assert.notEqual(challenge.otp_hash, delivered.code);

    const wrongCode = delivered.code === '111111' ? '222222' : '111111';
    await assert.rejects(
      verifyBookingOtp(db, { challengeId: requested.challengeId, code: wrongCode }),
      /invalid or expired/,
    );
    const session = await verifyBookingOtp(db, {
      challengeId: requested.challengeId,
      code: delivered.code,
    });
    const access = await getCustomerAccessSession(db, session.token);
    assert.ok(access.booking_ids.includes(first.booking.id));
    assert.equal(access.booking_ids.includes(later.booking.id), false);
    assert.equal(
      (await getBooking(db, { params: { id: first.booking.id }, customerAccess: access })).id,
      first.booking.id,
    );
    await assert.rejects(
      getBooking(db, { params: { id: later.booking.id }, customerAccess: access }),
      /Verify the email/,
    );
    await assert.rejects(
      verifyBookingOtp(db, { challengeId: requested.challengeId, code: delivered.code }),
      /invalid or expired/,
    );
    assert.equal(
      (
        await get(
          db,
          'SELECT consumed_at FROM booking_access_challenges WHERE id=?',
          requested.challengeId,
        )
      ).consumed_at > 0,
      true,
    );

    const expired = await requestBookingOtp(
      db,
      { reference: first.booking.reference, email: owner.email },
      { deliver },
    );
    await db.prisma.$executeRawUnsafe(
      'UPDATE booking_access_challenges SET expires_at=0 WHERE id=?',
      expired.challengeId,
    );
    await assert.rejects(
      verifyBookingOtp(db, { challengeId: expired.challengeId, code: delivered.code }),
      /invalid or expired/,
    );

    const locked = await requestBookingOtp(
      db,
      { reference: first.booking.reference, email: owner.email },
      { deliver },
    );
    const lockedWrong = delivered.code === '111111' ? '222222' : '111111';
    for (let attempt = 0; attempt < 5; attempt++)
      await assert.rejects(
        verifyBookingOtp(db, { challengeId: locked.challengeId, code: lockedWrong }),
        /invalid or expired/,
      );
    await assert.rejects(
      verifyBookingOtp(db, { challengeId: locked.challengeId, code: delivered.code }),
      /invalid or expired/,
    );
  } finally {
    await db.close();
  }
});
