import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { openDb, all, get, run } from '../../src/config/database.js';
import { seed } from '../../prisma/seed.js';
import {
  quoteCheckout,
  reserveCheckout,
  checkoutCatalog,
} from '../../src/modules/bookings/checkout.service.js';
import {
  createBooking,
  getBooking,
  cancelBooking,
  reschedule,
} from '../../src/modules/bookings/booking.service.js';
import {
  createCustomerAccessSession,
  getCustomerAccessSession,
} from '../../src/modules/bookings/customerAccess.service.js';
import { bookingView } from '../../src/modules/bookings/booking.read.service.js';
import { recordPayment } from '../../src/modules/payments/payment.service.js';
import { createApp } from '../../src/app.js';
import { createAddOn, editAddOn } from '../../src/modules/addons/addOn.service.js';

let db, bike, car, duplicate, period, helmet, staff;
beforeEach(async () => {
  process.env.ADMIN_PASSWORD = randomBytes(20).toString('hex');
  db = await openDb(':memory:');
  await seed(db);
  staff = await get(db, "SELECT * FROM users WHERE role='admin' LIMIT 1");
  helmet = await createAddOn(
    db,
    {
      code: 'helmet',
      name: 'Extra helmets',
      rate: 2500,
      billing: 'booking',
      stock: 4,
      unserviceable: 0,
      maxQuantity: 4,
      enabled: true,
      categories: [
        { category: 'Bike', includedQuantity: 0 },
        { category: 'Scooter', includedQuantity: 0 },
      ],
    },
    staff,
  );
  bike = await get(
    db,
    "SELECT * FROM vehicles WHERE category='Bike' AND status='Available' LIMIT 1",
  );
  car = await get(db, "SELECT * FROM vehicles WHERE category='Car' AND status='Available' LIMIT 1");
  duplicate = randomUUID();
  await run(
    db,
    'INSERT INTO vehicles(id,slug,name,brand,category,registration,rate,deposit,fuel,transmission,seats,engine,image,description,odometer,status,created_at) SELECT ?,?,name,brand,category,?,rate,deposit,fuel,transmission,seats,engine,image,description,odometer,status,created_at FROM vehicles WHERE id=?',
    duplicate,
    'test-second-unit-' + duplicate,
    'TEST-' + duplicate,
    bike.id,
  );
  period = {
    startsAt: new Date(Date.now() + 48 * 3600000).toISOString(),
    endsAt: new Date(Date.now() + 52 * 3600000).toISOString(),
  };
});
afterEach(async () => {
  await db.close();
});
const selection = () => ({
  ...period,
  items: [
    { vehicleId: bike.id, quantity: 2 },
    { vehicleId: car.id, quantity: 1 },
  ],
  helmets: 3,
});
async function reservation(input = selection()) {
  const quote = await quoteCheckout(db, input);
  return {
    ...input,
    name: 'Checkout Test',
    phone: '9876500066',
    email: 'checkout@example.com',
    agreement: true,
    expectedTotal: quote.total,
    submissionKey: randomUUID(),
    reservationToken: randomBytes(32).toString('hex'),
  };
}

test('mixed checkout reserves distinct identical-model units and helmets with exact totals and idempotent retry', async () => {
  const catalog = await checkoutCatalog(db, period);
  assert.equal(catalog.models.find((v) => v.unitIds.includes(bike.id)).available, 2);
  const input = await reservation();
  const quoted = await quoteCheckout(db, input);
  assert.equal(quoted.helmets.base, 7500);
  const result = await reserveCheckout(db, input);
  assert.equal(result.bookings.length, 3);
  assert.equal(new Set(result.bookings.map((row) => row.booking.vehicle_id)).size, 3);
  assert.equal(
    result.bookings.reduce((sum, row) => sum + row.booking.total, 0),
    quoted.total,
  );
  assert.equal(result.bookings[0].booking.checkout.total, quoted.total);
  assert.equal(result.bookings[0].booking.addons[0].quantity, 3);
  assert.equal((await reserveCheckout(db, input)).bookings.length, 3);
  assert.equal((await all(db, 'SELECT * FROM checkout_orders')).length, 1);
  await assert.rejects(
    reserveCheckout(db, { ...input, expectedTotal: input.expectedTotal + 1 }),
    /already used/,
  );
  const owner = result.bookings[0].booking.customer_id;
  const session = await createCustomerAccessSession(
    db,
    owner,
    result.bookings.map((row) => row.booking.id),
  );
  const access = await getCustomerAccessSession(db, session.token);
  for (const entry of result.bookings)
    assert.equal(
      (await getBooking(db, { params: { id: entry.booking.id }, customerAccess: access })).id,
      entry.booking.id,
    );
  await assert.rejects(
    getBooking(db, { params: { id: result.bookings[0].booking.id }, customerAccess: null }),
    /Verify the email/,
  );
});

test('rejects duplicate model rows, unavailable quantity, tampered total and unconfigured or ineligible helmets', async () => {
  const emptyPeriod = {
    ...period,
    startsAt: new Date(Date.parse(period.startsAt) + 10 * 86400000).toISOString(),
    endsAt: new Date(Date.parse(period.endsAt) + 10 * 86400000).toISOString(),
  };
  await createBooking(db, {
    ...emptyPeriod,
    vehicleId: car.id,
    name: 'Stock holder',
    phone: '9876500012',
    agreement: true,
  });
  const emptyInput = { ...emptyPeriod, items: [{ vehicleId: car.id, quantity: 1 }], helmets: 0 };
  await assert.rejects(quoteCheckout(db, emptyInput), /only 0 available/);
  const before = (await get(db, 'SELECT COUNT(*) n FROM bookings')).n;
  await assert.rejects(
    reserveCheckout(db, {
      ...emptyInput,
      name: 'Blocked booking',
      phone: '9876500013',
      email: 'blocked@example.com',
      agreement: true,
      submissionKey: randomUUID(),
      reservationToken: randomBytes(32).toString('hex'),
      expectedTotal: 0,
    }),
    /only 0 available/,
  );
  assert.equal((await get(db, 'SELECT COUNT(*) n FROM bookings')).n, before);
  await assert.rejects(
    quoteCheckout(db, { ...selection(), items: [{ vehicleId: bike.id, quantity: 3 }] }),
    /only 2 available/,
  );
  await assert.rejects(
    quoteCheckout(db, {
      ...selection(),
      items: [
        { vehicleId: bike.id, quantity: 1 },
        { vehicleId: duplicate, quantity: 1 },
      ],
    }),
    /quantity control/,
  );
  const input = await reservation();
  await assert.rejects(reserveCheckout(db, { ...input, expectedTotal: 1 }), /price changed/);
  assert.equal((await all(db, 'SELECT * FROM checkout_orders')).length, 0);
  await assert.rejects(
    quoteCheckout(db, { ...selection(), items: [{ vehicleId: car.id, quantity: 1 }] }),
    /requires an eligible vehicle category/,
  );
  helmet = await editAddOn(db, helmet.id, { ...helmet, enabled: false }, staff);
  assert.equal((await checkoutCatalog(db, period)).helmets.enabled, false);
  await assert.rejects(quoteCheckout(db, selection()), /not been configured/);
});

test('concurrent checkout cannot double-book stock; transaction failure leaves no partial order', async () => {
  const first = await reservation();
  const second = await reservation();
  const results = await Promise.allSettled([
    reserveCheckout(db, first),
    reserveCheckout(db, second),
  ]);
  assert.equal(results.filter((row) => row.status === 'fulfilled').length, 1);
  assert.equal((await all(db, 'SELECT * FROM checkout_items')).length, 3);
  assert.equal((await checkoutCatalog(db, period)).helmets.available, 1);
  const next = {
    ...period,
    startsAt: new Date(Date.parse(period.startsAt) + 86400000).toISOString(),
    endsAt: new Date(Date.parse(period.endsAt) + 86400000).toISOString(),
  };
  const input = await reservation({ ...selection(), ...next });
  await run(
    db,
    `CREATE TRIGGER reject_checkout_car BEFORE INSERT ON bookings WHEN NEW.vehicle_id='${car.id}' BEGIN SELECT RAISE(ABORT,'test allocation failure'); END`,
  );
  const before = (await get(db, 'SELECT COUNT(*) n FROM bookings')).n;
  await assert.rejects(reserveCheckout(db, input), /test allocation failure/);
  assert.equal((await get(db, 'SELECT COUNT(*) n FROM bookings')).n, before);
  assert.equal((await all(db, 'SELECT * FROM checkout_orders')).length, 1);
});

test('helmet hourly rates are snapshotted, included in staff payments, released on cancellation and protected from partial rescheduling', async () => {
  helmet = await editAddOn(db, helmet.id, { ...helmet, billing: 'hour' }, staff);
  const input = await reservation({
    ...selection(),
    items: [{ vehicleId: bike.id, quantity: 1 }],
    helmets: 2,
  });
  const result = await reserveCheckout(db, input);
  const booking = result.bookings[0].booking;
  assert.equal(booking.addons[0].base, 2 * 2500 * booking.hours);
  helmet = await editAddOn(db, helmet.id, { ...helmet, rate: 9900 }, staff);
  assert.equal((await bookingView(db, booking.id)).total, booking.total);

  const paid = await recordPayment(db, {
    params: { id: booking.id },
    body: { purpose: 'rental', amount: booking.rentalTotal, method: 'Cash', note: '' },
    user: staff,
  });
  assert.equal(paid.rentalPaid, booking.rentalTotal);
  await assert.rejects(reschedule(db, booking.id, period, staff), /cancel and rebook/);
  await cancelBooking(db, { params: { id: booking.id }, user: staff });
  assert.equal((await checkoutCatalog(db, period)).helmets.available, 4);
});

test('checkout HTTP routes enforce CSRF and reserve a single vehicle through the existing checkout contract', async () => {
  const origins = [];
  const server = createApp(db, { origins }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  origins.push(url);
  try {
    const sessionResponse = await fetch(url + '/api/session');
    const session = await sessionResponse.json();
    const cookie = sessionResponse.headers.get('set-cookie').split(';')[0];
    const body = await reservation({
      ...selection(),
      items: [{ vehicleId: car.id, quantity: 1 }],
      helmets: 0,
    });
    const blocked = await fetch(url + '/api/checkout/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(body),
    });
    assert.equal(blocked.status, 403);
    const response = await fetch(url + '/api/checkout/reserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        'X-CSRF-Token': session.csrf,
        Origin: url,
      },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).bookings.length, 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
