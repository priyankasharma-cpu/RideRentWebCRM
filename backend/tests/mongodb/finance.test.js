import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes, randomUUID } from 'node:crypto';
import { before, after, test } from 'node:test';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { collection, openMongoDb } from '../../src/config/mongoDatabase.js';
import { createSession } from '../../src/modules/auth/session.service.js';
import { financeQuery, reportWindow } from '../../src/modules/finance/finance.validation.js';
import { financeOverview } from '../../src/modules/finance/finance.service.js';
import { createBooking } from '../../src/modules/bookings/booking.service.js';

const databaseName = 'riderent_test_' + randomBytes(12).toString('hex');
const ids = Object.fromEntries(
  [
    'admin',
    'staff',
    'bike',
    'car',
    'customer',
    'order',
    'webBike',
    'webCar',
    'walk',
    'unknown',
    'public',
    'scheduled',
    'cancelled',
    'rentalReceipt',
    'depositReceipt',
    'cancelledReceipt',
  ].map((key) => [key, randomUUID()]),
);
const time = (day, hour = '10:00') => '2025-04-' + day + 'T' + hour + ':00.000Z';
const period = 'period=custom&from=2025-04-01&to=2025-04-30';
let db, server, origin, admin, staff;

async function seed(name, values) {
  await collection(db, name).insertMany(
    values.map((row) => {
      const id = row.id ?? randomUUID();
      return { _id: row._id ?? id, id, ...row };
    }),
  );
}
function booking(key, fields) {
  return {
    id: ids[key],
    reference: 'RR-' + key.toUpperCase(),
    customer_id: ids.customer,
    vehicle_id: ids.bike,
    starts_at: time('01'),
    ends_at: time('02'),
    created_at: time('01'),
    base: 10000,
    tax: 1000,
    extra: 0,
    deposit: 2000,
    status: 'completed',
    source: 'Website',
    ...fields,
  };
}
function receipt(bookingKey, amount, fields = {}) {
  return {
    booking_id: ids[bookingKey],
    amount,
    purpose: 'rental',
    method: 'UPI',
    staff_id: ids.admin,
    created_at: time('03'),
    ...fields,
  };
}
async function call(path, { role = 'admin', method = 'GET', body } = {}) {
  const session = role === 'admin' ? admin : role === 'staff' ? staff : null;
  return fetch(origin + '/api/admin/finance' + path, {
    method,
    headers: {
      Origin: origin,
      ...(session ? { Cookie: 'rr_session=' + session.token, 'X-CSRF-Token': session.csrf } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function json(path, options, expected = 200) {
  const response = await call(path, options);
  const data = await response.json();
  assert.equal(response.status, expected, JSON.stringify(data));
  return data;
}

before(async () => {
  if (env.NODE_ENV === 'production' || !env.MONGODB_URI)
    throw new Error('Finance integration requires a nonproduction test environment with MongoDB.');
  assert.match(databaseName, /^riderent_test_[a-f0-9]+$/);
  db = await openMongoDb({ uri: env.MONGODB_URI, databaseName });
  await seed('users', [
    {
      id: ids.admin,
      name: 'Finance Admin',
      email: 'finance@example.test',
      role: 'admin',
      active: 1,
    },
    { id: ids.staff, name: 'Rental Staff', email: 'staff@example.test', role: 'staff', active: 1 },
  ]);
  await seed('settings', [
    {
      _id: 1,
      id: 1,
      data: JSON.stringify({
        name: 'Finance Test Shop',
        timezone: 'Asia/Kolkata',
        taxBps: 0,
        roundingMinutes: 60,
        maxRentalDays: 90,
      }),
    },
  ]);
  await seed('vehicles', [
    {
      id: ids.bike,
      name: 'Test Bike',
      slug: 'test-bike',
      registration: 'TEST-BIKE',
      category: 'Bike',
      rate: 20000,
      deposit: 2000,
      status: 'Available',
    },
    {
      id: ids.car,
      name: 'Test Car',
      slug: 'test-car',
      registration: 'TEST-CAR',
      category: 'Car',
      rate: 50000,
      deposit: 4000,
      status: 'Available',
    },
  ]);
  await seed('customers', [{ id: ids.customer, name: 'Test Customer', phone: '9999999900' }]);
  await seed('bookings', [
    booking('webBike', { discount: 1000 }),
    booking('webCar', { vehicle_id: ids.car, base: 5000, tax: 500 }),
    booking('walk', { source: 'Walk-in', base: 20000, extra: 500 }),
    booking('unknown', { base: 8000, tax: 800 }),
    booking('public', { base: 4000, tax: 400 }),
    booking('scheduled', {
      source: 'Phone',
      finance_source: 'unknown',
      status: 'confirmed',
      base: 30000,
      tax: 3000,
    }),
    booking('cancelled', { source: 'Walk-in', status: 'cancelled', base: 20000 }),
  ]);
  await seed('audit', [
    { entity_id: ids.public, action: 'booking.created', user_id: null, created_at: time('01') },
  ]);
  await seed('checkout_items', [
    { booking_id: ids.webBike, order_id: ids.order },
    { booking_id: ids.webCar, order_id: ids.order },
  ]);
  await seed('addon_allocations', [
    { booking_id: ids.webBike, addon_id: randomUUID(), base: 500, tax: 50 },
  ]);
  await seed('rentals', [
    { booking_id: ids.webBike, return_at: time('01', '18:29') },
    { booking_id: ids.webCar, return_at: time('01', '18:30') },
    { booking_id: ids.walk, return_at: time('02') },
    { booking_id: ids.unknown, return_at: time('02') },
    { booking_id: ids.public, return_at: time('03') },
  ]);
  await seed('payments', [
    receipt('scheduled', 10000, { id: ids.rentalReceipt }),
    receipt('webBike', 500, { purpose: 'deposit', created_at: '2025-01-15T10:00:00.000Z' }),
    receipt('webBike', 2000, { id: ids.depositReceipt, purpose: 'deposit', method: 'Cash' }),
    receipt('cancelled', 3000, { id: ids.cancelledReceipt }),
    receipt('walk', 15000, { status: 'failed' }),
    receipt('walk', 5000, { status: 'voided' }),
  ]);
  await seed('refunds', [
    { payment_id: ids.rentalReceipt, amount: 2000, created_at: time('04') },
    { payment_id: ids.depositReceipt, amount: 1250, created_at: time('04') },
    { payment_id: ids.rentalReceipt, amount: 7000, status: 'failed', created_at: time('04') },
  ]);
  await seed('finance_adjustments', [
    {
      bookingId: ids.cancelled,
      kind: 'cancellation_fee',
      amount: 1000,
      date: time('06'),
      staffId: ids.admin,
    },
  ]);
  await seed('expenses', [
    {
      title: 'Shop insurance',
      category: 'Insurance',
      amount: 7000,
      method: 'UPI',
      date: time('04'),
      localDate: '2025-04-04',
      status: 'completed',
      version: 1,
    },
    {
      title: 'Pending servicing',
      category: 'Vehicle servicing',
      amount: 3500,
      method: 'Card',
      date: time('04'),
      localDate: '2025-04-04',
      status: 'pending',
      vehicleId: ids.bike,
      version: 1,
    },
  ]);

  admin = await createSession(db, ids.admin);
  staff = await createSession(db, ids.staff);
  server = createApp(db).listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = 'http://127.0.0.1:' + server.address().port;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (db) {
    try {
      assert.match(databaseName, /^riderent_test_[a-f0-9]+$/);
      await db.db.dropDatabase();
    } finally {
      await db.close();
    }
  }
});

test('all finance routes enforce staff sessions, the admin role, and input validation', async () => {
  for (const path of [
    'overview',
    'revenue-trends',
    'revenue-by-source',
    'revenue-by-category',
    'revenue-by-vehicle',
    'payment-methods',
    'transactions',
    'profit-loss',
    'expenses',
    'reports/export',
  ]) {
    await json('/' + path, { role: 'anonymous' }, 401);
    await json('/' + path, { role: 'staff' }, 403);
  }
  await json('/expenses', { role: 'staff', method: 'POST', body: {} }, 403);
  await json('/overview?period=custom&from=2025-04-01', {}, 400);
  await json('/transactions?limit=101', {}, 400);
  await json('/overview?source=phone', {}, 400);
});

test('combined, website, walk-in and unknown revenue, grouped bookings, refunds and deposits reconcile', async () => {
  const data = await json('/overview?' + period);
  assert.equal(data.current.revenue, 48000);
  assert.equal(data.current.website, 18500);
  assert.equal(data.current.walk_in, 21500);
  assert.equal(data.current.unknown, 8000);
  assert.equal(data.current.bookings, 5);
  assert.equal(data.current.average, 9600);
  assert.equal(data.current.grossBooking, 84750);
  assert.equal(data.current.outstanding, 75750);
  assert.equal(data.current.payments, 13000);
  assert.equal(data.current.refunds, 2000);
  assert.equal(data.current.netCollections, 11000);
  assert.equal(data.current.depositsCollected, 2000);
  assert.equal(data.current.depositsReturned, 1250);
  assert.equal(data.current.depositsNet, 750);
  assert.equal(data.current.depositsHeld, 1250);
  assert.equal(data.previous.depositsHeld, 500);
  assert.equal(data.current.expenses, 7000);
  assert.equal(data.current.profit, 41000);
  assert.equal(data.current.discounts, 1000);
  assert.equal(data.current.cancellationFees, 1000);
  assert.equal(data.series[0].website, 9500);
  assert.equal(data.series[1].website, 5000);
  assert.equal(data.series[0].bookings, 1);
  assert.equal(data.series[1].bookings, 2);
  assert.equal(
    data.series.reduce((sum, row) => sum + row.revenue, 0),
    data.current.revenue,
  );
  assert.equal(
    data.vehicles.reduce((sum, row) => sum + row.amount, 0),
    data.current.revenue,
  );
  assert.deepEqual(data.methods, [{ id: 'UPI', name: 'UPI', amount: 13000 }]);

  for (const [source, amount] of [
    ['website', 18500],
    ['walk_in', 21500],
    ['unknown', 8000],
  ]) {
    const result = await json('/overview?' + period + '&source=' + source);
    assert.equal(result.current.revenue, amount);
    assert.equal(result.current.expenses, 0);
  }
  const category = await json('/revenue-by-category?' + period + '&category=Car');
  assert.deepEqual(category.categories, [{ id: 'Car', name: 'Car', amount: 5000 }]);
  const pnl = await json('/profit-loss?' + period);
  assert.equal(pnl.current.profit, data.current.profit);
});

test('weekly, monthly, quarterly and yearly buckets reconcile independently of time zone boundaries', async () => {
  for (const period of ['this_week', 'this_month', 'this_quarter', 'this_year']) {
    const query = financeQuery.parse({ period, interval: 'week' });
    const window = reportWindow(query, 'Asia/Kolkata', new Date('2025-04-02T10:00:00.000Z'));
    const data = await financeOverview(db, query, window);
    assert.equal(data.current.revenue, 48000);
    assert.equal(
      data.series.reduce((sum, row) => sum + row.bookings, 0),
      5,
    );
  }
  const empty = await json('/overview?period=custom&from=2010-01-01&to=2010-01-03');
  assert.equal(empty.current.revenue, 0);
  assert.equal(empty.changes.revenue, null);
  assert.equal(empty.series.length, 3);
});

test('ledger uses server filters, sort and pagination, and exports the active selection', async () => {
  const failed = await json('/transactions?' + period + '&status=failed&sort=highest&limit=1');
  assert.equal(failed.total, 2);
  assert.equal(failed.rows[0].amount, 15000);
  const page = await json('/transactions?' + period + '&status=failed&sort=highest&limit=1&page=2');
  assert.equal(page.rows[0].amount, 7000);
  const ledger = await json(
    '/transactions?' + period + '&search=RR-SCHEDULED&type=payment&status=completed',
  );
  assert.equal(ledger.total, 1);
  assert.equal(ledger.rows[0].recordedBy, 'Finance Admin');
  const response = await call(
    '/reports/export?' + period + '&report=transactions&type=payment&search=RR-SCHEDULED',
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /riderent-transactions-2025-04-01.csv/);
  const csv = await response.text();
  assert.match(csv, /"Finance Test Shop"/);
  assert.match(csv, /"payment",100/);
  assert.match(csv, /"RR-SCHEDULED"/);
  assert.doesNotMatch(csv, /"RR-CANCELLED"/);
});

test('partial payment and refund writes are idempotent and protect retained fees', async () => {
  const body = {
    amount: 400,
    purpose: 'rental',
    method: 'UPI',
    reference: 'processor-123',
    submissionKey: randomUUID(),
  };
  const path = '/bookings/' + ids.scheduled + '/payments';
  const options = { method: 'POST', body };
  await Promise.all([json(path, options, 201), json(path, options, 201)]);
  assert.equal(
    await collection(db, 'payments').countDocuments({ submission_key: body.submissionKey }),
    1,
  );
  await json(path, { method: 'POST', body: { ...body, amount: 401 } }, 409);
  await json(
    path,
    { method: 'POST', body: { ...body, reference: 'PROCESSOR-123', submissionKey: randomUUID() } },
    409,
  );
  await json(
    path,
    {
      method: 'POST',
      body: { ...body, amount: 500000, reference: '', submissionKey: randomUUID() },
    },
    400,
  );
  await json(
    '/payments/' + ids.cancelledReceipt + '/refund',
    {
      method: 'POST',
      body: { amount: 2100, reason: 'Return balance', submissionKey: randomUUID() },
    },
    409,
  );
  const refund = { amount: 1000, reason: 'Return part of deposit', submissionKey: randomUUID() };
  const refundPath = '/payments/' + ids.depositReceipt + '/refund';
  await json(refundPath, { method: 'POST', body: refund }, 400);
  refund.amount = 500;
  await json(refundPath, { method: 'POST', body: refund }, 201);
  await json(refundPath, { method: 'POST', body: refund }, 201);
  assert.equal(
    await collection(db, 'refunds').countDocuments({ submission_key: refund.submissionKey }),
    1,
  );
});

test('expenses validate linked records, preserve settled amounts, and append an audited reversal', async () => {
  const body = {
    title: 'Test receipt',
    category: 'Fuel',
    amount: 9001,
    date: '2025-04-10',
    method: 'Cash',
    status: 'pending',
    vehicleId: ids.bike,
    submissionKey: randomUUID(),
    vendor: 'Test Vendor',
    receipt: 'EXT-123',
  };
  await json('/expenses', { method: 'POST', body: { ...body, vehicleId: randomUUID() } }, 404);
  const first = await json('/expenses', { method: 'POST', body }, 201);
  assert.deepEqual(await json('/expenses', { method: 'POST', body }, 201), first);
  const path = '/expenses/' + first.id;
  const paid = { ...body, amount: 9000, version: first.version, status: 'completed' };
  const second = await json(path, { method: 'PATCH', body: paid });
  assert.equal(second.version, 2);
  await json(path, { method: 'PATCH', body: paid }, 409);
  await json(path, { method: 'PATCH', body: { ...paid, version: 2, amount: 6000 } }, 409);
  const reversal = {
    version: 2,
    date: '2025-04-11',
    notes: 'Duplicate vendor payment',
    submissionKey: randomUUID(),
  };
  const reversePath = path + '/reverse';
  await json(reversePath, { method: 'POST', body: reversal }, 201);
  await json(reversePath, { method: 'POST', body: reversal }, 201);
  const rows = await json('/expenses?' + period + '&expenseCategory=Fuel');
  assert.equal(rows.total, 2);
  assert.deepEqual(
    rows.rows.map((row) => row.amount),
    [-9000, 9000],
  );
  const history = await json(path + '/history');
  assert.deepEqual(
    history.rows.map((row) => row.action),
    ['finance.expense.reversed', 'finance.expense.updated', 'finance.expense.created'],
  );
  const pnl = await json('/profit-loss?' + period);
  assert.equal(pnl.current.expenses, 7000);
});

test('authorized revenue adjustments reconcile to source and profit without moving cash', async () => {
  const adjustment = {
    bookingId: ids.webBike,
    amount: -100,
    kind: 'revenue_adjustment',
    date: '2025-04-20',
    notes: 'Accounting correction',
    submissionKey: randomUUID(),
  };
  await json(
    '/adjustments',
    { method: 'POST', body: { ...adjustment, bookingId: ids.scheduled } },
    409,
  );
  await json('/adjustments', { method: 'POST', body: adjustment }, 201);
  await json('/adjustments', { method: 'POST', body: adjustment }, 201);
  const data = await json('/overview?' + period + '&source=website');
  assert.equal(data.current.revenue, 18400);
  assert.equal(data.current.payments, 0);
  assert.equal(data.current.adjustments, -100);
});

test('new public and manual reservations persist validated finance sources', async () => {
  const base = {
    vehicleId: ids.car,
    name: 'Source Test Customer',
    email: 'source@example.test',
    phone: '9999999911',
    agreement: true,
  };
  const cases = [
    [null, undefined, 'website'],
    [{ id: ids.admin }, 'walk_in', 'walk_in'],
    [{ id: ids.admin }, undefined, 'unknown'],
    [{ id: ids.admin }, 'website', 'website'],
  ];
  for (const [index, [user, source, expected]] of cases.entries()) {
    const start = Date.now() + (index + 2) * 86400000;
    const { booking } = await createBooking(
      db,
      {
        ...base,
        source,
        startsAt: new Date(start).toISOString(),
        endsAt: new Date(start + 3600000).toISOString(),
      },
      user,
    );
    assert.equal(booking.finance_source, expected);
    assert.equal(
      (await collection(db, 'bookings').findOne({ id: booking.id })).finance_source,
      expected,
    );
  }
  await assert.rejects(
    createBooking(db, {
      ...base,
      source: 'walk_in',
      startsAt: '2025-04-01T10:00:00.000Z',
      endsAt: '2025-04-01T11:00:00.000Z',
    }),
    /Only staff/,
  );
});

test('date, source, status and expense filters can use the installed index prefixes', async () => {
  const span = { $gte: time('01'), $lt: time('30') };
  const cases = [
    ['bookings', { starts_at: span, status: 'completed' }, 'bookings_finance_start_status'],
    ['bookings', { finance_source: 'website', starts_at: span }, 'bookings_finance_source_start'],
    ['rentals', { return_at: span }, 'rentals_finance_return'],
    ['payments', { status: 'failed', created_at: span }, 'payments_finance_status_date'],
    ['refunds', { created_at: span }, 'refunds_finance_date'],
    ['expenses', { category: 'Insurance', date: span }, 'expenses_category_date'],
  ];
  for (const [name, query, index] of cases) {
    const plan = await collection(db, name).find(query).hint(index).explain('executionStats');
    assert.match(JSON.stringify(plan.queryPlanner.winningPlan), /IXSCAN/);
    assert.ok(plan.executionStats.totalKeysExamined >= plan.executionStats.nReturned);
  }
});

test(
  'administrator can use the built finance UI on desktop and mobile',
  {
    skip: process.env.RIDERENT_FINANCE_UI_TEST !== '1',
    timeout: 90000,
  },
  async () => {
    const { chromium } = await import('@playwright/test');
    const { join } = await import('node:path');
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        acceptDownloads: true,
      });
      await context.addCookies([{ name: 'rr_session', value: admin.token, url: origin }]);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(origin + '/admin/finance');
      await page.getByRole('heading', { name: 'Finance Management', exact: true }).waitFor();
      await page.getByLabel('Date range').selectOption('custom');
      await page.getByLabel('From', { exact: true }).fill('2025-04-01');
      await page.getByLabel('Through', { exact: true }).fill('2025-04-30');
      await page.getByRole('heading', { name: 'Total combined revenue' }).waitFor();
      await page.getByRole('heading', { name: 'Revenue trend', exact: true }).waitFor();
      await page.getByRole('button', { name: 'View data table' }).first().click();
      await page.getByRole('table').first().waitFor();
      await page.getByRole('button', { name: 'Hide data table' }).first().click();
      assert.equal(await page.locator('canvas').count(), 8);
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Export report' }).click();
      assert.match((await downloadPromise).suggestedFilename(), /summary-2025-04-01.csv$/);
      if (process.env.RIDERENT_FINANCE_SCREENSHOTS) {
        await page.screenshot({
          path: join(process.env.RIDERENT_FINANCE_SCREENSHOTS, 'riderent-finance-desktop.png'),
          fullPage: true,
        });
      }
      for (const [name, heading] of [
        ['Revenue Analytics', 'Revenue Analytics'],
        ['Website Revenue', 'Website Revenue'],
        ['Walk-in Revenue', 'Walk-in Revenue'],
        ['Transactions', 'Transactions'],
        ['Expenses', 'Expenses'],
        ['Profit & Loss', 'Profit & Loss'],
        ['Financial Reports', 'Financial Reports'],
      ]) {
        await page.getByRole('link', { name, exact: true }).click();
        await page.getByRole('heading', { name: heading, exact: true, level: 1 }).waitFor();
        if (name === 'Expenses') {
          await page.getByRole('button', { name: 'Record expense', exact: true }).click();
          await page.getByLabel('Expense title').waitFor();
          await page.getByRole('button', { name: 'Close', exact: true }).click();
        }
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(origin + '/admin/finance');
      await page.getByRole('heading', { name: 'Finance Management', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Toggle admin navigation' }).click();
      await page.getByRole('link', { name: 'Finance Overview' }).waitFor();
      await page.getByRole('button', { name: 'Close sidebar' }).click();
      await page.evaluate(() => localStorage.setItem('riderent-theme', 'dark'));
      await page.reload();
      await page.getByRole('heading', { name: 'Total combined revenue' }).waitFor();
      await page.getByLabel('Date range').selectOption('custom');
      await page.getByLabel('From', { exact: true }).fill('2025-04-01');
      await page.getByLabel('Through', { exact: true }).fill('2025-04-30');
      await page.getByRole('heading', { name: 'Revenue trend', exact: true }).waitFor();
      await page.locator('canvas').first().waitFor();
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
      assert.equal(
        await page.evaluate(
          () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
        ),
        true,
      );
      if (process.env.RIDERENT_FINANCE_SCREENSHOTS) {
        await page.screenshot({
          path: join(process.env.RIDERENT_FINANCE_SCREENSHOTS, 'riderent-finance-mobile.png'),
        });
      }
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  },
);
