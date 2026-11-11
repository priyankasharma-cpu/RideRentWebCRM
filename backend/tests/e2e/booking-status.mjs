import { chromium, expect } from '../../node_modules/@playwright/test/index.mjs';
import { openDb, get, run } from '../../src/config/database.js';
import { seed } from '../../prisma/seed.js';
import { createApp } from '../../src/app.js';
import { createBooking } from '../../src/modules/bookings/booking.service.js';
import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { shopInput } from '../../../frontend/src/utils/rentalTime.js';

process.env.ADMIN_EMAIL = 'booking-status-ui@riderent.local';
process.env.ADMIN_PASSWORD = randomBytes(20).toString('hex');
const db = await openDb(':memory:');
await seed(db);
const vehicle = await get(db, "SELECT * FROM vehicles WHERE status='Available' LIMIT 1");
const { booking } = await createBooking(db, {
  vehicleId: vehicle.id,
  name: 'Payment Return Tester',
  phone: '9876500082',
  email: 'return@example.com',
  agreement: true,
  startsAt: new Date(Date.now() + 15 * 60000).toISOString(),
  endsAt: new Date(Date.now() + 255 * 60000).toISOString(),
});
const origins = [];
const server = createApp(db, { origins }).listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
origins.push(base);
const browser = await chromium.launch({ channel: 'msedge' });
const admin = await browser.newPage({ viewport: { width: 1440, height: 1100 } }),
  customer = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
for (const page of [admin, customer]) {
  page.setDefaultTimeout(20000);
  page.on('pageerror', (error) => errors.push(error.message));
}
const out = 'backend/.artifacts/booking-status';
mkdirSync(out, { recursive: true });
const dialog = () => admin.getByRole('dialog');
const payment = (page) => page.getByLabel('Payment status', { exact: true });
async function openBooking() {
  await admin.goto(base + '/admin/bookings', { waitUntil: 'networkidle' });
  await admin.getByRole('textbox', { name: 'Search bookings' }).fill(booking.reference);
  await admin.getByRole('button', { name: 'Manage', exact: true }).click();
}
async function receipt(purpose, amount) {
  await dialog().getByRole('button', { name: 'Record Payment', exact: true }).click();
  await dialog().getByLabel('Payment purpose').selectOption(purpose);
  if (amount !== undefined) await dialog().locator('[name=amount]').fill(String(amount));
  await dialog().getByRole('button', { name: 'Record Receipt', exact: true }).click();
  await expect(dialog().locator('.action-form')).toHaveCount(0);
}
try {
  await customer.goto(base + '/my-bookings');
  await customer.getByLabel('Booking reference').fill(booking.reference);
  await customer.getByLabel('Mobile number').fill('9876500082');
  await customer.getByRole('button', { name: 'Find My Booking' }).click();
  await expect(payment(customer)).toHaveText('Payment pending');
  await expect(customer.locator('.booking-facts')).toContainText('4 hours');
  await customer.screenshot({ path: out + '/customer-pending.png', fullPage: true });
  await customer.getByRole('button', { name: 'Reschedule', exact: true }).click();
  const editedReturn = shopInput(new Date(Date.now() + 300 * 60000));
  await customer.getByLabel('Return date and time').fill(editedReturn);
  await admin.goto(base + '/admin');
  await admin.getByLabel('Email address').fill(process.env.ADMIN_EMAIL);
  await admin.getByLabel('Password', { exact: true }).fill(process.env.ADMIN_PASSWORD);
  await admin.getByRole('button', { name: 'Sign In to Workspace' }).click();
  await expect(admin.getByRole('heading', { name: 'A good day starts here.' })).toBeVisible();
  await openBooking();
  await expect(payment(dialog())).toHaveText('Payment pending');
  await expect(dialog()).toContainText('Rental duration:');
  await expect(dialog()).toContainText('4 hours');
  await dialog().getByRole('button', { name: 'Verify Driving License' }).click();
  await receipt('rental', booking.rentalTotal / 200);
  await expect(payment(dialog())).toHaveText('Part payment · Balance pending');
  await customer.bringToFront();
  await expect(payment(customer)).toHaveText('Part payment · Balance pending', { timeout: 22000 });
  await expect(customer.getByLabel('Return date and time')).toHaveValue(editedReturn);
  await customer.getByRole('button', { name: 'Reschedule', exact: true }).click();
  await admin.bringToFront();
  await receipt('rental');
  if (booking.deposit > 0) await receipt('deposit');
  await expect(payment(dialog())).toHaveText('Payment done');
  await customer.bringToFront();
  await expect(payment(customer)).toHaveText('Payment done', { timeout: 22000 });
  await admin.bringToFront();
  await dialog().getByRole('button', { name: 'Mark as Picked Up' }).click();
  await dialog().getByLabel('Vehicle condition').fill('Good at pickup');
  await dialog().getByRole('button', { name: 'Save Pickup Inspection' }).click();
  await expect(dialog().locator('.manage-header .status')).toHaveText('active');
  // Simulate elapsed time only in this disposable fixture, keeping chronological timestamps valid.
  await run(
    db,
    'UPDATE bookings SET starts_at=?,ends_at=? WHERE id=?',
    new Date(Date.now() - 5 * 3600000).toISOString(),
    new Date(Date.now() - 3600000).toISOString(),
    booking.id,
  );
  await run(
    db,
    'UPDATE rentals SET pickup_at=? WHERE booking_id=?',
    new Date(Date.now() - 5 * 3600000).toISOString(),
    booking.id,
  );
  await expect(dialog()).toContainText('Time ended · Not returned', { timeout: 22000 });
  await customer.bringToFront();
  await expect(customer.locator('.booking-timing-notice')).toContainText('has not been returned', {
    timeout: 22000,
  });
  await admin.goto(base + '/admin');
  await expect(admin.locator('.overview-callout--overdue')).toContainText('not returned');
  await openBooking();
  await expect(admin.locator('.rental-deadline-alert')).toContainText('not been returned');
  await admin.screenshot({ path: out + '/admin-overdue.png', fullPage: true });
  await dialog().getByRole('button', { name: 'Mark as Returned' }).click();
  await dialog().getByLabel('Vehicle condition').fill('Good at return');
  await dialog().getByRole('button', { name: 'Save Return Inspection' }).click();
  await expect(dialog()).toContainText('Returned to shop');
  await expect(dialog().locator('.booking-timing-notice')).toHaveCount(0);
  await customer.bringToFront();
  await expect(customer.getByText('Returned to shop', { exact: true })).toBeVisible({
    timeout: 22000,
  });
  await expect(customer.locator('.booking-timing-notice')).toHaveCount(0);
  await admin.bringToFront();
  if (await dialog().getByRole('button', { name: 'Record Payment', exact: true }).count())
    await receipt('rental');
  await dialog().getByRole('button', { name: 'Complete Inspection & Close' }).click();
  await dialog().getByRole('button', { name: 'Close Rental', exact: true }).click();
  await expect(dialog().locator('.manage-header .status')).toHaveText('completed');
  await customer.bringToFront();
  await expect(customer.getByRole('heading', { name: 'Your ride, returned.' })).toBeVisible({
    timeout: 22000,
  });
  await expect(payment(customer)).toHaveText('Payment done', { timeout: 22000 });
  await customer.screenshot({ path: out + '/customer-returned.png', fullPage: true });
  for (const page of [admin, customer])
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `status overflow ${width}`,
      );
    }
  assert.equal(
    (await get(db, 'SELECT count(*) n FROM payments WHERE booking_id=?', booking.id)).n >= 2,
    true,
  );
  assert.ok(
    (await get(db, 'SELECT return_at FROM rentals WHERE booking_id=?', booking.id)).return_at,
  );
  assert.deepEqual(errors, []);
  console.log(
    'PASS live pending/partial/paid customer and admin badges, exact duration, overdue notifications, saved return, inspection closing, automatic customer updates and responsive layouts.',
  );
} catch (error) {
  await admin.screenshot({ path: out + '/failure-admin.png', fullPage: true });
  await customer.screenshot({ path: out + '/failure-customer.png', fullPage: true });
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await db.close();
}
