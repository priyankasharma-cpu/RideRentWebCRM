import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingStates } from '../../src/modules/bookings/booking.status.js';
import { openDb, get } from '../../src/config/database.js';
import { seed } from '../../prisma/seed.js';
import { createBooking } from '../../src/modules/bookings/booking.service.js';
import { recordPayment } from '../../src/modules/payments/payment.service.js';
import { pickUpRental, returnRental } from '../../src/modules/rentals/rental.service.js';
import { randomBytes } from 'node:crypto';

const clock = Date.parse('2030-01-01T12:00:00Z');
const state = (overrides = {}) =>
  bookingStates(
    {
      status: 'confirmed',
      rentalTotal: 40000,
      rentalPaid: 0,
      depositPaid: 0,
      depositDue: 200000,
      endsAt: '2030-01-01T13:00:00Z',
      ...overrides,
    },
    clock,
  );
test('confirmed reservation is not paid; rental-only and deposit-only receipts remain partial', () => {
  assert.equal(state().paymentState, 'pending');
  assert.equal(state({ rentalPaid: 40000 }).paymentState, 'partial');
  assert.equal(state({ depositPaid: 200000 }).paymentState, 'partial');
  assert.equal(state({ rentalPaid: 40000, depositPaid: 200000 }).paymentState, 'paid');
});
test('expired uncollected booking is distinct from overdue active rental and exact end boundary', () => {
  assert.equal(state({ endsAt: '2030-01-01T12:00:00Z' }).rentalState, 'expired');
  assert.equal(state({ endsAt: '2030-01-01T12:00:00Z' }).overdue, false);
  assert.equal(state({ status: 'active', endsAt: '2030-01-01T12:00:00Z' }).rentalState, 'overdue');
  assert.equal(state({ status: 'active' }).rentalState, 'out');
});
test('actual return stops overdue before inspection closes; refunds never masquerade as paid', () => {
  assert.equal(
    state({
      status: 'inspecting',
      endsAt: '2029-12-31T12:00:00Z',
      returnAt: '2030-01-01T11:00:00Z',
    }).rentalState,
    'returned',
  );
  assert.equal(
    state({ status: 'completed', rentalPaid: 40000, depositDue: 0 }).paymentState,
    'paid',
  );
  assert.equal(
    state({ status: 'cancelled', rentalTotal: 0, depositDue: 0, rentalPaid: 40000 }).paymentState,
    'refund_pending',
  );
  assert.equal(
    state({ status: 'cancelled', rentalTotal: 0, depositDue: 0 }).paymentState,
    'not_required',
  );
});
test('saved receipts drive pending/partial/paid states and actual return is persisted', async () => {
  process.env.ADMIN_EMAIL = 'status-test@riderent.local';
  process.env.ADMIN_PASSWORD = randomBytes(20).toString('hex');
  const db = await openDb(':memory:');
  try {
    await seed(db);
    const user = await get(db, "SELECT * FROM users WHERE role='admin' LIMIT 1");
    const vehicle = await get(db, "SELECT * FROM vehicles WHERE status='Available' LIMIT 1");
    const startsAt = new Date(Date.now() + 15 * 60000).toISOString(),
      endsAt = new Date(Date.now() + 255 * 60000).toISOString();
    let { booking } = await createBooking(
      db,
      {
        vehicleId: vehicle.id,
        startsAt,
        endsAt,
        name: 'Receipt Test',
        phone: '9876500081',
        email: 'status@example.com',
        agreement: true,
        verified: true,
        source: 'Phone',
      },
      user,
    );
    assert.equal(booking.paymentState, 'pending');
    const receipt = async (purpose, amount) =>
      recordPayment(db, {
        params: { id: booking.id },
        user,
        body: { purpose, amount, method: 'Cash', note: 'isolated status test' },
      });
    booking = await receipt('rental', booking.rentalTotal);
    assert.equal(booking.paymentState, 'partial');
    if (booking.deposit > 0) booking = await receipt('deposit', booking.deposit);
    assert.equal(booking.paymentState, 'paid');
    assert.equal(booking.status, 'confirmed');
    const inspection = { odometer: vehicle.odometer, fuel: 'Full', condition: 'Good', notes: '' };
    booking = await pickUpRental(db, { params: { id: booking.id }, user, body: inspection });
    assert.equal(booking.rentalState, 'out');
    booking = await returnRental(db, {
      params: { id: booking.id },
      user,
      body: { ...inspection, additional: 0 },
    });
    assert.equal(booking.rentalState, 'returned');
    assert.equal(booking.status, 'inspecting');
    assert.ok(booking.rental.return_at);
    assert.equal(booking.overdue, false);
  } finally {
    await db.close();
  }
});
