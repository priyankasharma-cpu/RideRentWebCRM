import { chromium, expect } from '../../node_modules/@playwright/test/index.mjs';
import { openDb, get, run } from '../../src/config/database.js';
import { seed } from '../../prisma/seed.js';
import { createApp } from '../../src/app.js';
import { createBooking } from '../../src/modules/bookings/booking.service.js';
import { createAddOn } from '../../src/modules/addons/addOn.service.js';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { shopInput, toUTC, periodSearch } from '../../../frontend/src/utils/rentalTime.js';

process.env.ADMIN_EMAIL = 'availability-test@riderent.local';
process.env.ADMIN_PASSWORD = randomBytes(20).toString('hex');
const db = await openDb(':memory:');
await seed(db);
const staff = await get(db, "SELECT * FROM users WHERE role='admin' LIMIT 1");
await createAddOn(
  db,
  {
    code: 'helmet',
    name: 'Extra helmets',
    rate: 2500,
    billing: 'booking',
    stock: 10,
    unserviceable: 0,
    maxQuantity: 10,
    enabled: true,
    categories: [
      { category: 'Bike', includedQuantity: 0 },
      { category: 'Scooter', includedQuantity: 0 },
    ],
  },
  staff,
);
const bike = await get(
  db,
  "SELECT * FROM vehicles WHERE category='Bike' AND status='Available' LIMIT 1",
);
const scooter = await get(
  db,
  "SELECT * FROM vehicles WHERE category='Scooter' AND status='Available' LIMIT 1",
);
const car = await get(
  db,
  "SELECT * FROM vehicles WHERE category='Car' AND status='Available' LIMIT 1",
);
const clone = randomUUID();
await run(
  db,
  'INSERT INTO vehicles(id,slug,name,brand,category,registration,rate,deposit,fuel,transmission,seats,engine,image,description,odometer,status,created_at) SELECT ?,?,name,brand,category,?,rate,deposit,fuel,transmission,seats,engine,image,description,odometer,status,created_at FROM vehicles WHERE id=?',
  clone,
  'availability-copy-' + clone,
  'TEST-' + clone,
  bike.id,
);
const referenceTime = Math.ceil(Date.now() / 60000) * 60000;
const interval = (days, hours = 4) => {
  const start = new Date(referenceTime + days * 86400000);
  return { startsAt: shopInput(start), endsAt: shopInput(new Date(+start + hours * 3600000)) };
};
const selected = interval(3),
  blocked = interval(6),
  free = interval(8);
await createBooking(db, {
  vehicleId: scooter.id,
  startsAt: toUTC(blocked.startsAt),
  endsAt: toUTC(blocked.endsAt),
  name: 'Stock Holder',
  phone: '9876500061',
  agreement: true,
});
const origins = [];
const server = createApp(db, { origins }).listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
origins.push(base);
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const out = 'backend/.artifacts/availability-fixes';
mkdirSync(out, { recursive: true });
const card = (v) =>
  page
    .locator('.vehicle-card')
    .filter({ has: page.getByRole('heading', { name: v.name, exact: true }) })
    .first();
const confirm = () => page.getByRole('button', { name: 'Confirm Booking · Pay at Shop' });
const book = () => page.getByRole('link', { name: 'Book This Ride' });
const pickup = () => page.getByLabel('Pickup date and time');
const returning = () => page.getByLabel('Return date and time');
async function checkDates(period) {
  await expect(pickup()).toHaveValue(period.startsAt);
  await expect(returning()).toHaveValue(period.endsAt);
  const url = new URL(page.url());
  assert.equal(url.searchParams.get('startsAt'), period.startsAt);
  assert.equal(url.searchParams.get('endsAt'), period.endsAt);
}
async function fillCustomer() {
  await page.getByLabel('Full name', { exact: true }).fill('Availability Tester');
  await page.getByLabel('Mobile number', { exact: true }).fill('9876500062');
  await page.getByLabel('Email for booking verification').fill('availability@example.com');
  await page.locator('[name=agreement]').check();
}
try {
  await page.goto(base + '/vehicles', { waitUntil: 'networkidle' });
  await expect(card(bike).locator('.vehicle-availability')).toContainText('Select Dates');
  await expect(page.getByRole('link', { name: 'Book Now', exact: true })).toHaveCount(0);
  await page.goto(base + '/vehicles' + periodSearch(selected), { waitUntil: 'networkidle' });
  await card(bike).getByRole('link', { name: 'View specifications' }).click();
  await checkDates(selected);
  await expect(book()).toHaveAttribute('aria-disabled', 'false');
  await page.reload({ waitUntil: 'networkidle' });
  await checkDates(selected);
  await expect(book()).toHaveAttribute('aria-disabled', 'false');
  await page.getByRole('link', { name: '← All vehicles' }).click();
  await card(bike).getByRole('link', { name: 'Book Now', exact: true }).click();
  await checkDates(selected);
  await expect(confirm()).toBeEnabled();
  await returning().fill(interval(3, 5).endsAt);
  await expect(confirm()).toBeDisabled();
  await expect(confirm()).toBeEnabled();
  await page.goBack();
  await checkDates(selected);
  await page.goForward();
  await expect(returning()).toHaveValue(interval(3, 5).endsAt);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(returning()).toHaveValue(interval(3, 5).endsAt);
  console.log('PASS neutral listing; listing/details/checkout dates; refresh and back/forward.');
  await page.goto(base + '/checkout?' + new URLSearchParams({ vehicle: scooter.id, ...blocked }), {
    waitUntil: 'networkidle',
  });
  await expect(page.locator('.checkout-vehicles__row output')).toHaveText('0');
  await expect(page.locator('.checkout-vehicles__row')).toContainText('Currently Unavailable');
  await expect(confirm()).toBeDisabled();
  await expect(
    page.getByRole('button', { name: `Increase ${scooter.name} quantity` }),
  ).toBeDisabled();
  const countBefore = (await get(db, 'SELECT COUNT(*) n FROM bookings')).n;
  const session = await (await page.request.get(base + '/api/session')).json();
  const rejected = await page.request.post(base + '/api/checkout/reserve', {
    headers: { 'X-CSRF-Token': session.csrf },
    data: {
      vehicleId: scooter.id,
      items: [{ vehicleId: scooter.id, quantity: 1 }],
      startsAt: toUTC(blocked.startsAt),
      endsAt: toUTC(blocked.endsAt),
      name: 'Blocked attempt',
      phone: '9876500069',
      email: 'blocked-attempt@example.com',
      agreement: true,
      expectedTotal: 0,
      submissionKey: randomUUID(),
      reservationToken: randomBytes(32).toString('hex'),
    },
  });
  assert.equal(rejected.status(), 409);
  assert.equal((await get(db, 'SELECT COUNT(*) n FROM bookings')).n, countBefore);
  await pickup().fill(free.startsAt);
  await returning().fill(free.endsAt);
  await expect(confirm()).toBeEnabled();
  await expect(page.locator('.checkout-vehicles__row output')).toHaveText('1');
  console.log('PASS zero-stock selection/increment/confirmation guards and date-based recovery.');
  await page.goto(base + '/vehicles' + periodSearch(blocked), { waitUntil: 'networkidle' });
  await page.getByRole('checkbox').uncheck();
  await expect(card(scooter).getByRole('link', { name: 'Book Now', exact: true })).toHaveCount(0);
  await card(scooter).getByRole('link', { name: 'View Details', exact: true }).click();
  await checkDates(blocked);
  await expect(book()).toHaveAttribute('aria-disabled', 'true');
  // Reproduce the cached-success/refetch-failure path with SPA navigation.
  await page.goto(base + '/vehicles/' + bike.slug + periodSearch(selected), {
    waitUntil: 'networkidle',
  });
  await expect(book()).toHaveAttribute('aria-disabled', 'false');
  await page.route('**/api/quote', (route) =>
    route.fulfill({ status: 503, json: { error: 'Regression quote outage' } }),
  );
  await page.getByRole('link', { name: '← All vehicles' }).click();
  await card(bike).getByRole('link', { name: 'View specifications' }).click();
  await expect(page.getByRole('alert')).toContainText('Regression quote outage');
  await expect(book()).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('.price-breakdown')).toHaveCount(0);
  await page.unroute('**/api/quote');
  await page.getByRole('button', { name: 'Retry availability' }).click();
  await expect(book()).toHaveAttribute('aria-disabled', 'false');
  // The older six-hour response is delivered after the newer eight-hour response.
  let releaseOld,
    oldSeen = false;
  const gate = new Promise((resolve) => (releaseOld = resolve));
  let oldFinished;
  const finished = new Promise((resolve) => (oldFinished = resolve));
  const six = interval(3, 6),
    eight = interval(3, 8);
  await page.route('**/api/quote', async (route) => {
    const input = route.request().postDataJSON();
    if (input.endsAt === toUTC(six.endsAt)) {
      oldSeen = true;
      const response = await route.fetch();
      await gate;
      try {
        await route.fulfill({ response });
      } catch {
        /* cancelled request cannot update a newer query */
      } finally {
        oldFinished();
      }
    } else await route.continue();
  });
  await returning().fill(six.endsAt);
  await expect(book()).toHaveAttribute('aria-disabled', 'true');
  await expect.poll(() => oldSeen).toBe(true);
  await returning().fill(eight.endsAt);
  await expect(book()).toHaveAttribute('aria-disabled', 'false');
  await expect(page.locator('.price-breakdown')).toContainText('8 hours');
  releaseOld();
  await finished;
  await expect(page.locator('.price-breakdown')).toContainText('8 hours');
  await page.unroute('**/api/quote');
  console.log(
    'PASS cached quote outage/retry, rapid schedule changes and out-of-order response isolation.',
  );
  // Invalid dates do not trigger quote/stock requests.
  let invalidRequests = 0;
  const count = (r) => {
    if (r.url().includes('/api/quote') || r.url().includes('/api/checkout/catalog'))
      invalidRequests++;
  };
  page.on('request', count);
  await returning().fill(selected.startsAt);
  await page.waitForTimeout(450);
  assert.equal(invalidRequests, 0);
  await expect(book()).toHaveAttribute('aria-disabled', 'true');
  page.off('request', count);
  // Quote failure for checkout and immediate invalidation on vehicle/add-on quantity changes.
  await page.goto(base + '/checkout?' + new URLSearchParams({ vehicle: bike.id, ...selected }), {
    waitUntil: 'networkidle',
  });
  await expect(confirm()).toBeEnabled();
  await returning().fill(selected.startsAt);
  await expect(confirm()).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Retry availability' })).toHaveCount(0);
  await returning().fill(selected.endsAt);
  await expect(confirm()).toBeEnabled();
  // Quantity changes must use current state and remove only the requested row.
  const bikeQuantity = () => page.getByLabel(`${bike.name} selected quantity`, { exact: true });
  await page.getByRole('button', { name: `Increase ${bike.name} quantity` }).click();
  await expect(bikeQuantity()).toHaveText('2');
  await expect(confirm()).toBeEnabled();
  await page.getByRole('button', { name: `Decrease ${bike.name} quantity` }).click();
  await expect(bikeQuantity()).toHaveText('1');
  await page.getByLabel('Choose another vehicle').selectOption(car.id);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  let catalogSeen = false,
    releaseCatalog,
    finishCatalog;
  const catalogFinished = new Promise((resolve) => (finishCatalog = resolve));
  const catalogGate = new Promise((resolve) => (releaseCatalog = resolve));
  await page.route('**/api/checkout/catalog?*', async (route) => {
    catalogSeen = true;
    const response = await route.fetch();
    await catalogGate;
    try {
      await route.fulfill({ response });
    } catch {
      /* a navigation may abort this request */
    } finally {
      finishCatalog();
    }
  });
  await returning().fill(interval(3, 5).endsAt);
  await expect.poll(() => catalogSeen).toBe(true);
  await expect(confirm()).toBeDisabled();
  await page.getByRole('button', { name: `Decrease ${car.name} quantity` }).click();
  await expect(page.getByLabel(`${car.name} selected quantity`, { exact: true })).toHaveCount(0);
  await expect(bikeQuantity()).toHaveText('1');
  releaseCatalog();
  await catalogFinished;
  await page.unroute('**/api/checkout/catalog?*');
  await expect(confirm()).toBeEnabled();
  await returning().fill(selected.endsAt);
  await expect(confirm()).toBeEnabled();
  let quantityRequestSeen = false,
    releaseQuantity;
  const quantityGate = new Promise((resolve) => (releaseQuantity = resolve));
  await page.route('**/api/checkout/quote', async (route) => {
    if (route.request().postDataJSON().items[0].quantity === 2) {
      quantityRequestSeen = true;
      const response = await route.fetch();
      await quantityGate;
      try {
        await route.fulfill({ response });
      } catch {
        /* old request was aborted */
      }
    } else await route.continue();
  });
  await page.getByRole('button', { name: `Increase ${bike.name} quantity` }).click();
  await expect.poll(() => quantityRequestSeen).toBe(true);
  await expect(page.locator('.checkout-totals')).toContainText(`${bike.name} × 2`);
  await expect(page.locator('.checkout-totals__grand strong')).toHaveText('—');
  await expect(confirm()).toBeDisabled();
  await page.getByRole('button', { name: `Decrease ${bike.name} quantity` }).click();
  await expect(confirm()).toBeEnabled();
  releaseQuantity();
  await page.unroute('**/api/checkout/quote');
  await expect(page.locator('.checkout-totals')).toContainText(`${bike.name} × 1`);
  console.log(
    'PASS rapid quantity changes invalidate totals and isolate the older quote response.',
  );
  console.log(
    'PASS vehicle increment/decrement, zero removes only targeted model, remaining cart preserved.',
  );
  await page.route('**/api/checkout/quote', (route) =>
    route.fulfill({ status: 503, json: { error: 'Checkout quote outage' } }),
  );
  await page.getByRole('button', { name: `Increase ${bike.name} quantity` }).click();
  await expect(confirm()).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('Checkout quote outage');
  await page.unroute('**/api/checkout/quote');
  await page.getByRole('button', { name: 'Retry availability' }).click();
  await expect(confirm()).toBeEnabled();
  await expect(page.getByRole('button', { name: `Increase ${bike.name} quantity` })).toBeDisabled();
  await page.getByLabel('Choose another vehicle').selectOption(car.id);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(confirm()).toBeDisabled();
  await expect(confirm()).toBeEnabled();
  await page.getByRole('button', { name: 'Increase Extra helmets quantity' }).click();
  await expect(confirm()).toBeDisabled();
  await expect(confirm()).toBeEnabled();
  await expect(page.locator('.checkout-totals')).toContainText('1 extra');
  await fillCustomer();
  await confirm().click();
  await expect(page.getByRole('heading', { name: '3 vehicles reserved together' })).toBeVisible();
  console.log(
    'PASS checkout quote outage/retry; quantity/add-on invalidation; verified stock limits; real mixed three-vehicle confirmation.',
  );
  await page.goto(base + '/checkout?' + new URLSearchParams({ vehicle: scooter.id, ...free }), {
    waitUntil: 'networkidle',
  });
  await expect(confirm()).toBeEnabled();
  await fillCustomer();
  await confirm().click();
  await expect(page.getByRole('heading', { name: 'You’re all set to ride.' })).toBeVisible();
  console.log('PASS existing single-vehicle booking.');
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base + '/vehicles' + periodSearch(blocked), { waitUntil: 'networkidle' });
    await page.getByRole('checkbox').uncheck();
    for (const theme of ['light', 'dark']) {
      if ((await page.locator('html').getAttribute('data-theme')) !== theme)
        await page.getByRole('button', { name: `Switch to ${theme} theme` }).click();
      await page.waitForTimeout(450);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `listing overflow ${width} ${theme}`,
      );
      await page.screenshot({ path: `${out}/listing-${width}-${theme}.png` });
    }
  }
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base + '/checkout?' + new URLSearchParams({ vehicle: bike.id, ...free }), {
      waitUntil: 'networkidle',
    });
    await expect(confirm()).toBeEnabled();
    for (const theme of ['light', 'dark']) {
      if ((await page.locator('html').getAttribute('data-theme')) !== theme)
        await page.getByRole('button', { name: `Switch to ${theme} theme` }).click();
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `checkout overflow ${width} ${theme}`,
      );
      await page.screenshot({ path: `${out}/checkout-${width}-${theme}.png`, fullPage: true });
    }
  }
  assert.deepEqual(errors, []);
  console.log('PASS responsive listing themes and no runtime errors.');
} catch (error) {
  await page.screenshot({ path: out + '/failure.png', fullPage: true });
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await db.close();
}
