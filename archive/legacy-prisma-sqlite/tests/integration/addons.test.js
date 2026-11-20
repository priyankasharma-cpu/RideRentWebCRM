import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { openDb, get, all, run } from '../../src/config/database.js';
import { seed } from '../../prisma/seed.js';
import { createApp } from '../../src/app.js';
import {
  createAddOn,
  editAddOn,
  archiveAddOn,
  managedAddOns,
} from '../../src/modules/addons/addOn.service.js';
import { peakCommitment } from '../../src/modules/addons/addOn.inventory.js';
import {
  checkoutCatalog,
  quoteCheckout,
  reserveCheckout,
} from '../../src/modules/bookings/checkout.service.js';
import { bookingView } from '../../src/modules/bookings/booking.read.service.js';
import {
  cancelBooking,
  createBooking,
  reserveManualBooking,
  reserveWebsiteBooking,
} from '../../src/modules/bookings/booking.service.js';
import { addOnInput } from '../../src/modules/addons/addOn.validation.js';

let db,
  staff,
  bike,
  car,
  server,
  base,
  day = 10;
const password = randomBytes(20).toString('hex');
const definition = (code, overrides = {}) => ({
  code,
  name: 'Test ' + code,
  rate: 3000,
  billing: 'booking',
  stock: 8,
  unserviceable: 0,
  maxQuantity: 8,
  enabled: true,
  categories: [
    { category: 'Bike', includedQuantity: 0 },
    { category: 'Car', includedQuantity: 0 },
  ],
  ...overrides,
});
const period = () => {
  const startsAt = new Date(Date.now() + day++ * 86400000).toISOString();
  return { startsAt, endsAt: new Date(Date.parse(startsAt) + 4 * 3600000).toISOString() };
};
async function reserve(input) {
  const quote = await quoteCheckout(db, input);
  return reserveCheckout(db, {
    ...input,
    name: 'Add-on Tester',
    phone: '9876500044',
    email: 'addon@example.com',
    agreement: true,
    submissionKey: randomUUID(),
    reservationToken: randomBytes(32).toString('hex'),
    expectedTotal: quote.total,
    quoteSignature: quote.signature,
  });
}
before(async () => {
  process.env.ADMIN_EMAIL = 'addons-test@riderent.local';
  process.env.ADMIN_PASSWORD = password;
  db = await openDb(':memory:');
  await seed(db);
  staff = await get(db, "SELECT * FROM users WHERE role='admin' LIMIT 1");
  bike = await get(
    db,
    "SELECT * FROM vehicles WHERE category='Bike' AND status='Available' LIMIT 1",
  );
  car = await get(db, "SELECT * FROM vehicles WHERE category='Car' AND status='Available' LIMIT 1");
  server = createApp(db).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.close();
});

test('definition persistence, validation, optimistic version checks and archive preserve audit history', async () => {
  assert.equal(addOnInput.safeParse(definition('invalid', { rate: -1 })).success, false);
  assert.equal(
    addOnInput.safeParse(definition('invalid', { stock: 1, unserviceable: 2 })).success,
    false,
  );
  assert.equal(
    addOnInput.safeParse(
      definition('invalid', {
        categories: [
          { category: 'Bike', includedQuantity: 0 },
          { category: 'Bike', includedQuantity: 1 },
        ],
      }),
    ).success,
    false,
  );
  let addon = await createAddOn(db, definition('phone-holder'), staff);
  assert.equal(addon.rate, 3000);
  assert.equal(addon.version, 1);
  await assert.rejects(createAddOn(db, definition('phone-holder'), staff), /already exists/);
  const previous = addon;
  addon = await editAddOn(db, addon.id, { ...addon, rate: 5000, billing: 'hour' }, staff);
  assert.equal(addon.version, 2);
  assert.equal(addon.billing, 'hour');
  await assert.rejects(editAddOn(db, addon.id, { ...previous, rate: 1000 }, staff), /changed/);
  await assert.rejects(
    editAddOn(db, addon.id, { ...addon, code: 'changed-code' }, staff),
    /cannot change/,
  );
  await archiveAddOn(db, addon.id, { version: addon.version }, staff);
  assert.equal((await managedAddOns(db)).find((row) => row.id === addon.id).enabled, false);
  assert.equal(
    (
      await get(
        db,
        "SELECT COUNT(*) n FROM audit WHERE entity_id=? AND action LIKE 'addon.%'",
        addon.id,
      )
    ).n,
    3,
  );
});

test('peak stock counts simultaneous commitments, permits adjacency and conservatively holds issued equipment', () => {
  const start = '2030-01-01T10:00:00.000Z',
    middle = '2030-01-01T11:00:00.000Z',
    end = '2030-01-01T12:00:00.000Z';
  const windows = [
    { status: 'confirmed', starts_at: start, ends_at: middle, quantity: 2 },
    { status: 'confirmed', starts_at: middle, ends_at: end, quantity: 2 },
  ];
  assert.equal(peakCommitment(windows, start, end), 2);
  assert.equal(
    peakCommitment(
      [
        ...windows,
        { status: 'active', starts_at: '2020-01-01', ends_at: '2020-01-02', quantity: 1 },
      ],
      start,
      end,
    ),
    3,
  );
});

test('legacy website and staff booking paths share add-on allocation, snapshots, stock guards and cancellation release', async () => {
  const raincoat = await createAddOn(
    db,
    definition('shared-raincoat', {
      name: 'Raincoat',
      rate: 500,
      billing: 'hour',
      stock: 4,
      maxQuantity: 4,
      categories: [
        { category: 'Bike', includedQuantity: 1 },
        { category: 'Car', includedQuantity: 1 },
      ],
    }),
    staff,
  );
  const nextBike = await get(
    db,
    "SELECT id FROM vehicles WHERE category='Bike' AND id<>? AND status='Available' LIMIT 1",
    bike.id,
  );
  const window = period();
  const input = {
    ...window,
    vehicleId: bike.id,
    name: 'Legacy Website Customer',
    phone: '9876500048',
    email: 'legacy-addon@example.com',
    agreement: true,
    addOns: [{ addOnId: raincoat.id, quantity: 1 }],
  };
  const website = await reserveWebsiteBooking(db, { body: input });
  const websiteSnapshot = website.booking.addons.find((row) => row.code === raincoat.code);
  assert.equal(websiteSnapshot.quantity, 2);
  assert.equal(websiteSnapshot.included_quantity, 1);
  assert.equal(websiteSnapshot.base, 500 * website.booking.hours);

  const staffBooking = await reserveManualBooking(db, {
    body: {
      ...input,
      vehicleId: nextBike.id,
      name: 'Staff Booking Customer',
      phone: '9876500049',
      email: '',
      addOns: [],
      source: 'Phone',
      verified: true,
    },
    user: staff,
  });
  assert.equal(
    staffBooking.booking.addons.find((row) => row.code === raincoat.code).included_quantity,
    1,
  );
  assert.equal(
    (await checkoutCatalog(db, window)).addOns.find((row) => row.id === raincoat.id).available,
    1,
  );

  const before = (await get(db, 'SELECT COUNT(*) n FROM bookings')).n;
  await assert.rejects(
    reserveWebsiteBooking(db, {
      body: {
        ...input,
        vehicleId: car.id,
        name: 'Overstock Attempt',
        phone: '9876500050',
      },
    }),
    /Not enough Raincoat stock/,
  );
  assert.equal((await get(db, 'SELECT COUNT(*) n FROM bookings')).n, before);
  await cancelBooking(db, { params: { id: website.booking.id }, user: staff });
  assert.equal(
    (await checkoutCatalog(db, window)).addOns.find((row) => row.id === raincoat.id).available,
    3,
  );
  await editAddOn(db, raincoat.id, { ...raincoat, enabled: false }, staff);
});

test('concurrent legacy and staff bookings serialize add-on stock reservations', async () => {
  const addon = await createAddOn(
    db,
    definition('single-stock-legacy', { stock: 1, maxQuantity: 1 }),
    staff,
  );
  const first = {
    ...period(),
    vehicleId: bike.id,
    name: 'Website race',
    phone: '9876500051',
    email: 'race@example.com',
    agreement: true,
    addOns: [{ addOnId: addon.id, quantity: 1 }],
  };
  const second = {
    ...first,
    vehicleId: car.id,
    name: 'Staff race',
    phone: '9876500052',
    email: '',
    addOns: [{ addOnId: addon.id, quantity: 1 }],
    source: 'Phone',
  };
  const outcomes = await Promise.allSettled([
    createBooking(db, first),
    createBooking(db, second, staff),
  ]);
  assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(outcomes.filter((result) => result.status === 'rejected').length, 1);
  assert.equal(
    (await get(db, 'SELECT COUNT(*) n FROM addon_allocations WHERE addon_id=?', addon.id)).n,
    1,
  );
});

test('included units consume stock, mixed generic add-ons have exact charges and confirmed snapshots survive edits', async () => {
  let helmet = await createAddOn(
    db,
    definition('helmet', {
      name: 'Extra helmets',
      categories: [{ category: 'Bike', includedQuantity: 1 }],
      maxQuantity: 4,
    }),
    staff,
  );
  let holder = await createAddOn(
    db,
    definition('luggage-holder', { rate: 500, billing: 'hour' }),
    staff,
  );
  const input = {
    ...period(),
    items: [{ vehicleId: bike.id, quantity: 1 }],
    helmets: 2,
    addOns: [{ addOnId: holder.id, quantity: 2 }],
  };
  const quoted = await quoteCheckout(db, input);
  assert.equal(quoted.addOns.length, 2);
  assert.equal(quoted.helmets.includedQuantity, 1);
  assert.equal(quoted.helmets.totalQuantity, 3);
  assert.equal(quoted.helmets.base, 6000);
  const result = await reserve(input);
  const booking = result.bookings[0].booking;
  assert.equal(booking.addons.length, 2);
  assert.equal(booking.total, quoted.total);
  assert.equal(booking.addons.find((row) => row.code === 'helmet').included_quantity, 1);
  helmet = await editAddOn(db, helmet.id, { ...helmet, rate: 5000 }, staff);
  holder = await editAddOn(db, holder.id, { ...holder, name: 'Renamed holder', rate: 1000 }, staff);
  assert.equal((await bookingView(db, booking.id)).total, booking.total);
  assert.equal(
    (await bookingView(db, booking.id)).addons.find((row) => row.code === 'luggage-holder').name,
    'Test luggage-holder',
  );
  const future = await quoteCheckout(db, { ...input, ...period() });
  assert.equal(future.helmets.rate, 5000);
  await assert.rejects(
    editAddOn(db, helmet.id, { ...helmet, stock: 2 }, staff),
    /already committed/,
  );
  await assert.rejects(quoteCheckout(db, { ...input, ...period(), helmets: 4 }), /maximum 4 units/);
  await assert.rejects(
    quoteCheckout(db, {
      ...input,
      ...period(),
      items: [{ vehicleId: car.id, quantity: 1 }],
      addOns: [],
    }),
    /eligible vehicle/,
  );
  await cancelBooking(db, { params: { id: booking.id }, user: staff });
  assert.equal(
    (await checkoutCatalog(db, { startsAt: input.startsAt, endsAt: input.endsAt })).helmets
      .available,
    8,
  );
  await archiveAddOn(db, holder.id, { version: holder.version }, staff);
  assert.equal((await bookingView(db, booking.id)).addons.length, 2);
  // Disable included units so later tests exercise generic add-ons independently.
  await editAddOn(db, helmet.id, { ...helmet, enabled: false }, staff);
});

test('non-overlapping reservations do not falsely exhaust stock; stock reductions check peak future demand', async () => {
  let addon = await createAddOn(db, definition('raincoat', { stock: 2, maxQuantity: 2 }), staff);
  const window = period(),
    middle = new Date(Date.parse(window.startsAt) + 2 * 3600000).toISOString();
  await reserve({
    ...window,
    endsAt: middle,
    items: [{ vehicleId: bike.id, quantity: 1 }],
    addOns: [{ addOnId: addon.id, quantity: 2 }],
  });
  await reserve({
    ...window,
    startsAt: middle,
    items: [{ vehicleId: car.id, quantity: 1 }],
    addOns: [{ addOnId: addon.id, quantity: 2 }],
  });
  const publicOption = (await checkoutCatalog(db, window)).addOns.find(
    (row) => row.id === addon.id,
  );
  assert.equal(publicOption.reserved, 2);
  assert.equal(publicOption.available, 0);
  addon = await editAddOn(db, addon.id, { ...addon, stock: 3 }, staff);
  assert.equal(addon.stock, 3);
  await assert.rejects(
    editAddOn(db, addon.id, { ...addon, stock: 1 }, staff),
    /2 serviceable units/,
  );
});

test('concurrent different-vehicle reservations cannot oversell shared add-on stock', async () => {
  const addon = await createAddOn(
    db,
    definition('navigation-device', { stock: 1, maxQuantity: 1 }),
    staff,
  );
  const window = period();
  const results = await Promise.allSettled([
    reserve({
      ...window,
      items: [{ vehicleId: bike.id, quantity: 1 }],
      addOns: [{ addOnId: addon.id, quantity: 1 }],
    }),
    reserve({
      ...window,
      items: [{ vehicleId: car.id, quantity: 1 }],
      addOns: [{ addOnId: addon.id, quantity: 1 }],
    }),
  ]);
  assert.equal(results.filter((row) => row.status === 'fulfilled').length, 1);
  assert.equal(
    (await get(db, 'SELECT COUNT(*) n FROM addon_allocations WHERE addon_id=?', addon.id)).n,
    1,
  );
});

test('legacy helmet snapshots still occupy stock and retain their historical total', async () => {
  let helmet = (await managedAddOns(db)).find((row) => row.code === 'helmet');
  helmet = await editAddOn(
    db,
    helmet.id,
    { ...helmet, enabled: true, categories: [{ category: 'Bike', includedQuantity: 0 }], stock: 8 },
    staff,
  );
  const window = period();
  const result = await createBooking(db, {
    ...window,
    vehicleId: bike.id,
    name: 'Legacy Test',
    phone: '9876500033',
    email: '',
    agreement: true,
  });
  await run(
    db,
    "INSERT INTO booking_addons(booking_id,quantity,rate,billing,base,tax) VALUES(?,3,2500,'booking',7500,0)",
    result.booking.id,
  );
  assert.equal((await checkoutCatalog(db, window)).helmets.available, 5);
  const booking = await bookingView(db, result.booking.id);
  assert.equal(booking.addons[0].name, 'Extra helmets');
  assert.equal(booking.total, result.booking.total + 7500);
  await editAddOn(db, helmet.id, { ...helmet, rate: 9999 }, staff);
  assert.equal((await bookingView(db, result.booking.id)).total, booking.total);
});

test('quote signature catches configuration changes even when the total remains unchanged', async () => {
  const addon = await createAddOn(db, definition('camera-mount'), staff);
  const input = {
    ...period(),
    items: [{ vehicleId: car.id, quantity: 1 }],
    addOns: [{ addOnId: addon.id, quantity: 1 }],
  };
  const quote = await quoteCheckout(db, input);
  await editAddOn(db, addon.id, { ...addon, name: 'Different mount' }, staff);
  await assert.rejects(
    reserveCheckout(db, {
      ...input,
      email: 'addon@example.com',
      name: 'Tester',
      phone: '9876500077',
      agreement: true,
      submissionKey: randomUUID(),
      reservationToken: randomBytes(32).toString('hex'),
      expectedTotal: quote.total,
      quoteSignature: quote.signature,
    }),
    /options changed/,
  );
});

test('creating a helmet master cannot understate legacy reservations', async () => {
  const legacyDb = await openDb(':memory:');
  try {
    await seed(legacyDb);
    const owner = await get(legacyDb, "SELECT * FROM users WHERE role='admin' LIMIT 1");
    const vehicle = await get(
      legacyDb,
      "SELECT * FROM vehicles WHERE category='Bike' AND status='Available' LIMIT 1",
    );
    const booking = await createBooking(legacyDb, {
      ...period(),
      vehicleId: vehicle.id,
      name: 'Legacy Holder',
      phone: '9876500099',
      agreement: true,
    });
    await run(
      legacyDb,
      "INSERT INTO booking_addons(booking_id,quantity,rate,billing,base,tax) VALUES(?,3,1000,'booking',3000,0)",
      booking.booking.id,
    );
    await assert.rejects(
      createAddOn(legacyDb, definition('helmet', { stock: 2 }), owner),
      /3 serviceable units/,
    );
    assert.equal((await get(legacyDb, 'SELECT COUNT(*) n FROM addons')).n, 0);
    const created = await createAddOn(legacyDb, definition('helmet', { stock: 3 }), owner);
    assert.equal(created.stock, 3);
  } finally {
    await legacyDb.close();
  }
});

test('admin HTTP APIs reject guests/staff and invalid CSRF, validate input and persist accepted edits', async () => {
  assert.equal((await fetch(base + '/api/admin/addons')).status, 401);
  const login = async (email, password) => {
    let response = await fetch(base + '/api/session');
    let session = await response.json(),
      cookie = response.headers.get('set-cookie').split(';')[0];
    response = await fetch(base + '/api/login', {
      method: 'POST',
      headers: { Cookie: cookie, 'X-CSRF-Token': session.csrf, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(response.status, 200);
    session = await response.json();
    cookie = response.headers.get('set-cookie')?.split(';')[0] || cookie;
    return { cookie, session };
  };
  const { cookie, session } = await login(process.env.ADMIN_EMAIL, password);
  const headers = {
    Cookie: cookie,
    'Content-Type': 'application/json',
    'X-CSRF-Token': session.csrf,
  };
  let response = await fetch(base + '/api/admin/addons', {
    method: 'POST',
    headers: { ...headers, 'X-CSRF-Token': 'wrong' },
    body: JSON.stringify(definition('api-example')),
  });
  assert.equal(response.status, 403);
  response = await fetch(base + '/api/admin/addons', {
    method: 'POST',
    headers,
    body: JSON.stringify(definition('api-example', { rate: -1 })),
  });
  assert.equal(response.status, 400);
  response = await fetch(base + '/api/admin/addons', {
    method: 'POST',
    headers,
    body: JSON.stringify(definition('api-example')),
  });
  assert.equal(response.status, 201);
  const addon = await response.json();
  response = await fetch(base + '/api/admin/addons/' + addon.id, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ ...addon, rate: 5000 }),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).rate, 5000);
  response = await fetch(base + '/api/admin/addons', { headers: { Cookie: cookie } });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.ok((await response.json()).some((row) => row.id === addon.id && row.rate === 5000));
  // A separate legitimate staff session must also fail the admin role boundary.
  const { passwordHash } = await import('../../src/utils/crypto.js');
  const userId = randomUUID();
  await run(
    db,
    'INSERT INTO users(id,name,email,password_hash,role,active,created_at) VALUES(?,?,?,?,?,?,?)',
    userId,
    'Test Staff',
    'addon-staff@riderent.local',
    await passwordHash(password),
    'staff',
    1,
    new Date().toISOString(),
  );
  const staffClient = await login('addon-staff@riderent.local', password);
  assert.equal(
    (await fetch(base + '/api/admin/addons', { headers: { Cookie: staffClient.cookie } })).status,
    403,
  );
  assert.ok((await all(db, 'SELECT * FROM addons WHERE id=?', addon.id)).length === 1);
});
