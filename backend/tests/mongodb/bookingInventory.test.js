import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { env } from '../../src/config/env.js';
import { collection, openMongoDb } from '../../src/config/mongoDatabase.js';
import { availability } from '../../src/modules/availability/availability.service.js';
import { cancelBooking, createBooking } from '../../src/modules/bookings/booking.service.js';
import { quoteCheckout, reserveCheckout } from '../../src/modules/bookings/checkout.service.js';
import { bookingView, listBookingViews } from '../../src/modules/bookings/booking.read.service.js';
import { insertPayment } from '../../src/modules/payments/payment.repository.js';
import {
  getCustomerAccessSession,
  requestBookingOtp,
  verifyBookingOtp,
} from '../../src/modules/bookings/customerAccess.service.js';
import { publicAddOns } from '../../src/modules/addons/addOn.service.js';

const databaseName = `riderent_test_${randomBytes(12).toString('hex')}`;
const testStart = Date.now() + 7 * 86400000;
const testPeriod = {
  startsAt: new Date(testStart).toISOString(),
  endsAt: new Date(testStart + 4 * 3600000).toISOString(),
};
let database;
let modelVehicles;
let limitedAddOnId;

function vehicleRecord(id, suffix) {
  return {
    _id: id,
    id,
    slug: `mongo-test-bike-${suffix}`,
    name: 'Mongo Test Bike',
    brand: 'RideRent Test',
    category: 'Bike',
    registration: `TEST-${suffix}`,
    rate: 8500,
    deposit: 0,
    fuel: 'Petrol',
    transmission: 'Manual',
    seats: 2,
    engine: '200cc',
    image: '/images/vehicles/test.webp',
    description: 'Isolated automated test fixture',
    odometer: 0,
    status: 'Available',
    created_at: new Date().toISOString(),
  };
}

function reservationInput({ vehicleId, phone, email }) {
  return {
    ...testPeriod,
    items: [{ vehicleId, quantity: 2 }],
    helmets: 0,
    addOns: [{ addOnId: limitedAddOnId, quantity: 1 }],
    name: 'Mongo Test Customer',
    phone,
    email,
    agreement: true,
    submissionKey: randomUUID(),
    reservationToken: randomBytes(32).toString('hex'),
  };
}

before(async () => {
  if (env.NODE_ENV === 'production') {
    throw new Error('MongoDB integration tests must not run with NODE_ENV=production.');
  }
  if (!env.MONGODB_URI) {
    throw new Error(
      'MongoDB integration tests require MONGODB_URI in backend/.env. Test data is isolated in a generated riderent_test_* database.',
    );
  }
  assert.match(databaseName, /^riderent_test_[a-f0-9]+$/);
  database = await openMongoDb({ uri: env.MONGODB_URI, databaseName });

  await collection(database, 'settings').insertOne({
    _id: 1,
    id: 1,
    data: JSON.stringify({
      timezone: 'Asia/Kolkata',
      taxBps: 0,
      roundingMinutes: 60,
      cancellationHours: 2,
      maxRentalDays: 30,
    }),
  });

  modelVehicles = [randomUUID(), randomUUID()];
  await collection(database, 'vehicles').insertMany(
    modelVehicles.map((id, index) => vehicleRecord(id, index + 1)),
  );

  limitedAddOnId = randomUUID();
  await collection(database, 'addons').insertOne({
    _id: limitedAddOnId,
    id: limitedAddOnId,
    code: 'test-raincoat',
    name: 'Test raincoat',
    description: '',
    image: '',
    rate: 2500,
    billing: 'booking',
    stock: 1,
    unserviceable: 0,
    max_quantity: 5,
    enabled: 1,
    archived_at: null,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  await collection(database, 'addon_categories').insertOne({
    _id: `${limitedAddOnId}:Bike`,
    addon_id: limitedAddOnId,
    category: 'Bike',
    included_quantity: 0,
  });
});

after(async () => {
  if (!database) return;
  try {
    if (!databaseName.startsWith('riderent_test_')) {
      throw new Error('Refusing to clean a database outside the isolated test prefix.');
    }
    await database.db.dropDatabase();
  } finally {
    await database.close();
  }
});

test('concurrent multi-unit checkout cannot oversell vehicles or add-ons; cancellation releases stock', async () => {
  const first = reservationInput({
    vehicleId: modelVehicles[0],
    phone: '9876501001',
    email: 'first@example.test',
  });
  const second = reservationInput({
    vehicleId: modelVehicles[0],
    phone: '9876501002',
    email: 'second@example.test',
  });
  const [firstQuote, secondQuote] = await Promise.all([
    quoteCheckout(database, first),
    quoteCheckout(database, second),
  ]);
  const attempts = await Promise.allSettled([
    reserveCheckout(database, {
      ...first,
      expectedTotal: firstQuote.total,
      quoteSignature: firstQuote.signature,
    }),
    reserveCheckout(database, {
      ...second,
      expectedTotal: secondQuote.total,
      quoteSignature: secondQuote.signature,
    }),
  ]);

  const fulfilled = attempts.filter((result) => result.status === 'fulfilled');
  const rejected = attempts.filter((result) => result.status === 'rejected');
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].reason.status, 409);
  assert.equal(fulfilled[0].value.bookings.length, 2);
  assert.equal(
    await collection(database, 'bookings').countDocuments({ vehicle_id: { $in: modelVehicles } }),
    2,
  );
  assert.equal(
    await collection(database, 'addon_allocations').countDocuments({ addon_id: limitedAddOnId }),
    1,
  );

  const bookings = fulfilled[0].value.bookings.map(({ booking }) => booking);
  const checkoutId = bookings[0].checkout.id;
  assert.ok(bookings.every((booking) => booking.checkout.id === checkoutId));
  assert.equal(
    bookings[0].checkout.totalPayable,
    bookings.reduce((sum, booking) => sum + booking.total, 0),
  );
  assert.equal(bookings[0].checkout.bookings.length, 2);

  const partiallyPaidBooking = bookings[0];
  await insertPayment(
    database,
    randomUUID(),
    partiallyPaidBooking.id,
    100,
    'rental',
    'cash',
    'Isolated checkout summary test',
    randomUUID(),
    new Date().toISOString(),
  );
  const afterPayment = await bookingView(database, partiallyPaidBooking.id);
  assert.equal(afterPayment.checkout.amountPaid, 100);
  assert.equal(
    afterPayment.checkout.outstanding,
    afterPayment.checkout.bookings.reduce((sum, booking) => sum + booking.outstanding, 0),
  );
  assert.equal(
    afterPayment.checkout.totalPayable,
    afterPayment.checkout.bookings.reduce((sum, booking) => sum + booking.totalPayable, 0),
  );
  const adminRowsAfterPayment = await listBookingViews(database);
  const adminPaidMember = adminRowsAfterPayment.find(
    (booking) => booking.id === partiallyPaidBooking.id,
  );
  assert.equal(adminPaidMember.checkout.id, afterPayment.checkout.id);
  assert.equal(adminPaidMember.checkout.totalPayable, afterPayment.checkout.totalPayable);
  assert.equal(adminPaidMember.checkout.amountPaid, afterPayment.checkout.amountPaid);
  assert.equal(adminPaidMember.checkout.outstanding, afterPayment.checkout.outstanding);

  const allocation = await collection(database, 'addon_allocations').findOne({
    addon_id: limitedAddOnId,
  });
  const cancelledBooking = bookings.find((booking) => booking.id === allocation.booking_id);
  await cancelBooking(database, {
    params: { id: cancelledBooking.id },
    user: { id: randomUUID() },
  });

  const afterCancellation = await bookingView(database, cancelledBooking.id);
  const cancelledMember = afterCancellation.checkout.bookings.find(
    (booking) => booking.id === cancelledBooking.id,
  );
  const remainingMember = afterCancellation.checkout.bookings.find(
    (booking) => booking.id !== cancelledBooking.id,
  );
  assert.equal(cancelledMember.status, 'cancelled');
  assert.equal(remainingMember.status, 'confirmed');
  assert.equal(
    afterCancellation.checkout.totalPayable,
    afterCancellation.checkout.bookings.reduce((sum, booking) => sum + booking.totalPayable, 0),
  );
  const adminRowsAfterCancellation = await listBookingViews(database);
  const adminCancelledMember = adminRowsAfterCancellation.find(
    (booking) => booking.id === cancelledBooking.id,
  );
  assert.equal(adminCancelledMember.checkout.totalPayable, afterCancellation.checkout.totalPayable);
  assert.equal(adminCancelledMember.checkout.paymentState, afterCancellation.checkout.paymentState);

  const availableAddOn = (
    await publicAddOns(database, {
      start: testPeriod.startsAt,
      end: testPeriod.endsAt,
    })
  ).find((option) => option.id === limitedAddOnId);
  assert.equal(availableAddOn.available, 1);

  let deliveredCode;
  const otpRequest = await requestBookingOtp(
    database,
    { reference: bookings[1].reference, email: bookings[1].customer.email },
    { deliver: async ({ code }) => (deliveredCode = code) },
  );
  assert.ok(deliveredCode);
  const access = await verifyBookingOtp(database, {
    challengeId: otpRequest.challengeId,
    code: deliveredCode,
  });
  assert.ok(access.token);
  assert.ok(await getCustomerAccessSession(database, access.token));
});

test('availability and booking service reject a second overlapping reservation for one physical unit', async () => {
  const vehicleId = randomUUID();
  await collection(database, 'vehicles').insertOne(vehicleRecord(vehicleId, 'single'));
  const input = {
    ...testPeriod,
    vehicleId,
    name: 'Single Unit Customer',
    phone: '9876501011',
    email: 'single@example.test',
    agreement: true,
    source: 'Website',
    helmets: 0,
    addOns: [],
  };

  const firstBooking = await createBooking(database, input);
  const status = await availability(database, vehicleId, testPeriod.startsAt, testPeriod.endsAt);
  assert.equal(status.available, false);
  await assert.rejects(
    () => createBooking(database, { ...input, phone: '9876501012' }),
    (error) => {
      assert.equal(error.status, 409);
      return true;
    },
  );
  assert.equal(firstBooking.booking.vehicle.id, vehicleId);
});
