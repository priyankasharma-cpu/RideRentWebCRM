import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
if (process.env.RIDERENT_E2E_MODE !== 'isolated')
  throw Error('Run this scenario with npm run test:ui or npm run test:layout.');
mkdirSync('backend/.artifacts/screenshots', { recursive: true });
const browser = await chromium.launch({
  headless: true,
  channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const base = process.env.TEST_BASE_URL;
const shop = (value) =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(value))
    .replace(' ', 'T');
const period = { start: shop(Date.now() + 15 * 60000), end: shop(Date.now() + 195 * 60000) };
const phone = '98' + String(Date.now()).slice(-8);
try {
  await page.addInitScript(() => {
    if (!localStorage.getItem('riderent-theme')) localStorage.setItem('riderent-theme', 'light');
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await expect(page.locator('.vehicle-card')).toHaveCount(5);
  await page.screenshot({
    path: 'backend/.artifacts/screenshots/light-desktop.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({
    path: 'backend/.artifacts/screenshots/dark-desktop.png',
    fullPage: true,
  });
  await page.locator('.booking-search').getByRole('button', { name: 'Car', exact: true }).click();
  await expect(page.locator('.road-stage')).toHaveAttribute(
    'aria-label',
    'Animated car driving along a road',
  );
  await page
    .locator('.booking-search')
    .getByRole('button', { name: 'Scooter', exact: true })
    .click();
  await page.getByRole('button', { name: 'Search Available Vehicles' }).click();
  await expect(page).toHaveURL(/\/vehicles\?/);
  await expect(page.locator('.listing-grid .vehicle-card')).toHaveCount(6);
  await page.goto(base + '/vehicles/yamaha-mt15', { waitUntil: 'networkidle' });
  await page.getByLabel('Pickup date and time').fill(period.start);
  await page.getByLabel('Return date and time').fill(period.end);
  const book = page.getByRole('link', { name: 'Book This Ride' });
  await expect(book).toHaveAttribute('aria-disabled', 'false');
  await book.click();
  await page.getByLabel('Full name').fill('E2E Demo Rider');
  await page.getByLabel('Mobile number').fill(phone);
  await page.getByLabel('Email (optional)').fill('e2e@example.com');
  await page.locator('[name=agreement]').check();
  await page.getByRole('button', { name: 'Confirm Booking · Pay at Shop' }).click();
  await expect(page.getByRole('heading', { name: 'You’re all set to ride.' })).toBeVisible();
  const reference = (await page.locator('.booking-reference').textContent()).trim();
  const bookingId = page.url().split('/').at(-1);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('.booking-reference')).toHaveText(reference);
  console.log(
    'PASS customer: theme persistence, category synchronization, live search, details, quote, booking, confirmation persistence.',
  );
  await page.goto(base + '/admin', { waitUntil: 'networkidle' });
  await page.getByLabel('Email address').fill(process.env.ADMIN_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(process.env.ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign In to Workspace' }).click();
  await expect(page.getByRole('heading', { name: 'A good day starts here.' })).toBeVisible();
  await page.screenshot({
    path: 'backend/.artifacts/screenshots/admin-dark-desktop.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await page.screenshot({
    path: 'backend/.artifacts/screenshots/admin-light-desktop.png',
    fullPage: true,
  });
  await page.goto(base + '/admin/bookings', { waitUntil: 'networkidle' });
  await page.getByRole('textbox', { name: 'Search bookings' }).fill(reference);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Manage' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Verify Driving License' }).click();
  await dialog.getByRole('button', { name: 'Record Payment', exact: true }).click();
  await dialog.getByRole('button', { name: 'Record Receipt', exact: true }).click();
  await expect(dialog.locator('.action-form')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Record Payment', exact: true }).click();
  await dialog.getByLabel('Payment purpose').selectOption('deposit');
  await dialog.getByRole('button', { name: 'Record Receipt', exact: true }).click();
  await expect(dialog.locator('.action-form')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Mark as Picked Up' }).click();
  await dialog.getByLabel('Vehicle condition').fill('Good — demo pickup');
  await dialog.getByRole('button', { name: 'Save Pickup Inspection' }).click();
  await expect(dialog.locator('.manage-header .status')).toHaveText('active');
  await dialog.getByRole('button', { name: 'Mark as Returned' }).click();
  const odo = Number(await dialog.getByLabel('Odometer (km)').inputValue());
  await dialog.getByLabel('Odometer (km)').fill(String(odo + 15));
  await dialog.getByLabel('Vehicle condition').fill('Good — demo return');
  await dialog.getByRole('button', { name: 'Save Return Inspection' }).click();
  await expect(dialog.locator('.manage-header .status')).toHaveText('inspecting');
  await dialog.getByRole('button', { name: 'Complete Inspection & Close' }).click();
  await dialog.getByRole('button', { name: 'Close Rental', exact: true }).click();
  await expect(dialog.locator('.manage-header .status')).toHaveText('completed');
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Record Refund' }).click();
  await expect(dialog.getByRole('button', { name: 'Record Refund' })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  console.log(
    'PASS admin: login, website booking visible, license verification, rental/deposit receipts, actual pickup and return, inspection, deposit refund.',
  );
  await page.goto(base + '/admin/create-booking', { waitUntil: 'networkidle' });
  await page.getByLabel('Full name', { exact: true }).fill('E2E Phone ' + phone);
  await page.getByLabel('Mobile number', { exact: true }).fill('97' + String(Date.now()).slice(-8));
  const option = await page
    .getByLabel('Specific vehicle')
    .locator('option')
    .filter({ hasText: 'Honda Dio' })
    .getAttribute('value');
  await page.getByLabel('Specific vehicle').selectOption(option);
  await page.getByRole('button', { name: 'Confirm Booking', exact: true }).click();
  await expect(page).toHaveURL(base + '/admin/bookings');
  await page.getByRole('textbox', { name: 'Search bookings' }).fill('E2E Phone ' + phone);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('.source-badge')).toHaveText('Phone');
  await page.getByRole('button', { name: 'Manage' }).click();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('dialog').locator('.manage-header .status')).toHaveText('cancelled');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.goto(base + '/admin', { waitUntil: 'networkidle' });
  await page.screenshot({
    path: 'backend/.artifacts/screenshots/admin-light-desktop.png',
    fullPage: true,
  });
  for (const path of [
    'vehicles',
    'availability',
    'active-rentals',
    'returns',
    'customers',
    'payments',
    'maintenance',
    'analytics',
    'staff',
    'settings',
  ]) {
    await page.goto(base + '/admin/' + path, { waitUntil: 'networkidle' });
    await expect(page.locator('.admin-page-title h1')).toBeVisible();
    assert.equal(await page.locator('.error-box').count(), 0, 'Error in admin ' + path);
  }
  console.log('PASS manual booking, source tracking, cancellation, and all 13 admin views.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/admin', { waitUntil: 'networkidle' });
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Admin mobile overflow',
  );
  await page.screenshot({
    path: 'backend/.artifacts/screenshots/admin-mobile.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Toggle admin navigation' }).click();
  await page.locator('.admin-sidebar').getByRole('link', { name: 'Vehicles', exact: true }).click();
  await expect(page.locator('.admin-sidebar')).not.toHaveClass(/open/);
  await page.goto(base + '/my-bookings', { waitUntil: 'networkidle' });
  await page.getByLabel('Booking reference').fill(reference);
  await page.getByLabel('Mobile number').fill(phone);
  await page.getByRole('button', { name: 'Find My Booking' }).click();
  await expect(page).toHaveURL(base + '/my-bookings/' + bookingId);
  await expect(page.locator('.confirmation-heading .status')).toHaveText('completed');
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.screenshot({
    path: 'backend/.artifacts/screenshots/light-mobile.png',
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Customer light mobile overflow',
  );
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.screenshot({ path: 'backend/.artifacts/screenshots/dark-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Toggle navigation', exact: true }).click();
  await page.locator('header nav').getByRole('link', { name: 'Vehicles', exact: true }).click();
  await expect(page.locator('header nav')).not.toBeVisible();
  for (const path of [
    'about',
    'contact',
    'how-it-works',
    'rental-policy',
    'faq',
    'privacy-policy',
    'terms',
    'vehicles',
  ]) {
    await page.goto(base + '/' + path, { waitUntil: 'networkidle' });
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'Mobile overflow: ' + path,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS booking lookup, mobile admin/customer navigation, responsive routes, and no runtime errors.',
  );
} catch (error) {
  await page.screenshot({ path: 'backend/.artifacts/screenshots/failure.png', fullPage: true });
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
