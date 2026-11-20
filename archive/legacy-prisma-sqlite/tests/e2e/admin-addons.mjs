import { chromium, expect } from '../../node_modules/@playwright/test/index.mjs';
import { openDb, get, run } from '../../src/config/database.js';
import { seed } from '../../prisma/seed.js';
import { createApp } from '../../src/app.js';
import { passwordHash } from '../../src/utils/crypto.js';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { shopInput } from '../../../frontend/src/utils/rentalTime.js';

// Requires npm run build. Uses only a disposable database and temporary test accounts.
process.env.ADMIN_EMAIL = 'admin-addons-e2e@riderent.local';
const password = randomBytes(20).toString('hex');
process.env.ADMIN_PASSWORD = password;
const db = await openDb(':memory:');
await seed(db);
await run(
  db,
  'INSERT INTO users(id,name,email,password_hash,role,active,created_at) VALUES(?,?,?,?,?,?,?)',
  randomUUID(),
  'Test Staff',
  'addons-staff-e2e@riderent.local',
  await passwordHash(password),
  'staff',
  1,
  new Date().toISOString(),
);
const bike = await get(
  db,
  "SELECT * FROM vehicles WHERE category='Bike' AND status='Available' LIMIT 1",
);
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
const screenshotDir = 'backend/.artifacts/admin-addons';
mkdirSync(screenshotDir, { recursive: true });
const dialog = () => page.getByRole('dialog');
const card = (name) =>
  page.locator('.admin-addon').filter({ has: page.getByRole('heading', { name, exact: true }) });
async function login(target, email) {
  await target.goto(base + '/admin/helmets');
  await target.getByLabel('Email address', { exact: true }).fill(email);
  await target.getByLabel('Password', { exact: true }).fill(password);
  await target.getByRole('button', { name: 'Sign In to Workspace' }).click();
}
async function save() {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/admin/addons') &&
      ['POST', 'PUT'].includes(response.request().method()),
  );
  await dialog().getByRole('button', { name: 'Save Settings', exact: true }).click();
  const response = await responsePromise;
  assert.ok(response.ok(), await response.text());
  await expect(dialog()).toHaveCount(0);
}
try {
  await login(page, process.env.ADMIN_EMAIL);
  await expect(page.getByRole('heading', { name: 'Helmets & Add-ons', exact: true })).toBeVisible();
  await expect(page).toHaveURL(base + '/admin/addons');
  await expect(
    page.locator('.admin-sidebar').getByRole('link', { name: 'Helmets & Add-ons', exact: true }),
  ).toHaveCount(1);
  await expect(page.locator('.admin-sidebar a[href="/admin/helmets"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Configure Helmets', exact: true }).click();
  await dialog().locator('[name=rate]').fill('30');
  await dialog()
    .getByLabel(/Billing type/)
    .selectOption('booking');
  await dialog().getByLabel('Total stock', { exact: true }).fill('10');
  await dialog().getByLabel('Damaged / unavailable stock', { exact: true }).fill('0');
  await dialog().locator('[name=maxQuantity]').fill('4');
  await dialog().getByLabel('Enable new rentals', { exact: true }).check();
  await dialog().getByRole('button', { name: 'Save Settings' }).click();
  await expect(dialog().getByRole('alert')).toContainText('Select at least one');
  await dialog().getByLabel('Bike', { exact: true }).check();
  await dialog().getByLabel('Included per vehicle', { exact: true }).fill('1');
  await save();
  await expect(card('Extra helmets')).toContainText('₹30');
  await page.reload();
  await expect(card('Extra helmets')).toContainText('1 included per vehicle');
  const id = (await get(db, "SELECT id FROM addons WHERE code='helmet'")).id;
  await page.goto(base + '/admin/helmets');
  await expect(page).toHaveURL(base + '/admin/addons');
  await expect(card('Extra helmets')).toContainText('₹30');
  assert.equal((await get(db, "SELECT count(*) n FROM addons WHERE code='helmet'")).n, 1);
  assert.equal((await get(db, "SELECT id FROM addons WHERE code='helmet'")).id, id);
  const guest = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  guest.on('pageerror', (error) => errors.push(error.message));
  const start = new Date(Date.now() + 96 * 3600000),
    end = new Date(+start + 4 * 3600000);
  const checkout =
    base +
    '/checkout?' +
    new URLSearchParams({ vehicle: bike.id, startsAt: shopInput(start), endsAt: shopInput(end) });
  await guest.goto(checkout);
  await expect(guest.locator('.checkout-vehicles__helmet')).toContainText('1 included');
  await guest.getByRole('button', { name: 'Increase Extra helmets quantity' }).click();
  await guest.getByRole('button', { name: 'Increase Extra helmets quantity' }).click();
  await guest.getByRole('button', { name: 'Increase Extra helmets quantity' }).click();
  await expect(
    guest.getByRole('button', { name: 'Increase Extra helmets quantity' }),
  ).toBeDisabled();
  await expect(guest.getByLabel('Extra helmets selected quantity', { exact: true })).toHaveText(
    '3',
  );
  await guest.getByRole('button', { name: 'Decrease Extra helmets quantity' }).click();
  await expect(guest.locator('.checkout-totals')).toContainText('1 included · 2 extra');
  await expect(guest.locator('.checkout-totals')).toContainText('₹60');
  await card('Extra helmets').getByRole('button', { name: 'Edit', exact: true }).click();
  await dialog().locator('[name=rate]').fill('50.25');
  await dialog()
    .getByLabel(/Billing type/)
    .selectOption('hour');
  await dialog().getByLabel('Total stock', { exact: true }).fill('12');
  await save();
  await guest.reload();
  await guest.getByRole('button', { name: 'Increase Extra helmets quantity' }).click();
  await expect(guest.locator('.checkout-totals')).toContainText('₹201');
  assert.equal((await get(db, 'SELECT rate FROM addons WHERE id=?', id)).rate, 5025);
  page.once('dialog', (confirmation) => confirmation.accept());
  await card('Extra helmets').getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(card('Extra helmets').locator('.admin-addon__status')).toHaveText('Paused');
  await guest.reload();
  await expect(guest.locator('.checkout-vehicles__helmet')).toContainText('currently unavailable');
  page.once('dialog', (confirmation) => confirmation.accept());
  await card('Extra helmets').getByRole('button', { name: 'Enable', exact: true }).click();
  await expect(card('Extra helmets').locator('.admin-addon__status')).toHaveText('Enabled');
  await guest.reload();
  await guest.getByRole('button', { name: 'Increase Extra helmets quantity' }).click();
  await expect(guest.locator('.checkout-totals')).toContainText('1 included · 1 extra');
  await guest.getByLabel('Full name', { exact: true }).fill('Helmet Snapshot Tester');
  await guest.getByLabel('Mobile number', { exact: true }).fill('9876500074');
  await guest.getByLabel('Email for booking verification').fill('helmet-test@example.com');
  await guest.locator('[name=agreement]').check();
  await guest.getByRole('button', { name: 'Confirm Booking · Pay at Shop' }).click();
  await expect(guest.locator('.price-breakdown')).toContainText('Extra helmets × 2');
  await page.goto(base + '/admin/bookings');
  await page
    .getByRole('row')
    .filter({ hasText: 'Helmet Snapshot Tester' })
    .getByRole('button', { name: 'Manage' })
    .click();
  await expect(page.getByLabel('Booked helmets and add-ons')).toContainText('Extra helmets × 2');
  await expect(page.getByLabel('Booked helmets and add-ons')).toContainText('1 included · 1 extra');
  await page.keyboard.press('Escape');
  console.log(
    'PASS confirmed helmet quantities and historical charges appear in customer confirmation and admin details.',
  );
  await page.goto(base + '/admin/addons');
  await page.getByRole('button', { name: 'Add Add-on', exact: true }).click();
  await dialog().getByLabel('Name', { exact: true }).fill('Phone holder');
  await dialog().locator('[name=code]').fill('phone-holder');
  await dialog().locator('[name=rate]').fill('15.50');
  await dialog()
    .getByLabel(/Billing type/)
    .selectOption('booking');
  await dialog().getByLabel('Total stock', { exact: true }).fill('5');
  await dialog().getByLabel('Damaged / unavailable stock', { exact: true }).fill('1');
  await dialog().locator('[name=maxQuantity]').fill('2');
  await dialog().getByLabel('Car', { exact: true }).check();
  await dialog().getByLabel('Enable new rentals', { exact: true }).check();
  await save();
  await expect(card('Phone holder')).toContainText('₹15.5');
  // A newly configured generic accessory must work without JSX changes.
  const car = await get(
    db,
    "SELECT * FROM vehicles WHERE category='Car' AND status='Available' LIMIT 1",
  );
  await guest.goto(
    base +
      '/checkout?' +
      new URLSearchParams({ vehicle: car.id, startsAt: shopInput(start), endsAt: shopInput(end) }),
  );
  await expect(guest.getByRole('button', { name: 'Increase Phone holder quantity' })).toBeEnabled();
  await guest.getByRole('button', { name: 'Increase Phone holder quantity' }).click();
  await guest.getByRole('button', { name: 'Increase Phone holder quantity' }).click();
  await expect(
    guest.getByRole('button', { name: 'Increase Phone holder quantity' }),
  ).toBeDisabled();
  await expect(guest.locator('.checkout-totals')).toContainText('Phone holder × 2');
  await expect(guest.locator('.checkout-totals')).toContainText('₹31');
  for (const width of [1440, 768, 390, 320]) {
    await guest.setViewportSize({ width, height: 1000 });
    for (const theme of ['light', 'dark']) {
      if ((await guest.locator('html').getAttribute('data-theme')) !== theme)
        await guest.getByRole('button', { name: `Switch to ${theme} theme` }).click();
      assert.equal(
        await guest.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `generic checkout overflow ${width} ${theme}`,
      );
      await guest.screenshot({
        path: `${screenshotDir}/generic-checkout-${width}-${theme}.png`,
        fullPage: true,
      });
    }
  }
  await guest.setViewportSize({ width: 1440, height: 1000 });
  page.once('dialog', (confirmation) => confirmation.accept());
  await card('Phone holder').getByRole('button', { name: 'Pause', exact: true }).click();
  await guest.reload();
  await expect(guest.getByRole('button', { name: 'Increase Phone holder quantity' })).toHaveCount(
    0,
  );
  page.once('dialog', (confirmation) => confirmation.accept());
  await card('Phone holder').getByRole('button', { name: 'Enable', exact: true }).click();
  await guest.reload();
  await guest.getByRole('button', { name: 'Increase Phone holder quantity' }).click();
  await guest.getByRole('button', { name: 'Increase Phone holder quantity' }).click();
  await guest.getByLabel('Full name', { exact: true }).fill('Generic Accessory Tester');
  await guest.getByLabel('Mobile number', { exact: true }).fill('9876500075');
  await guest.getByLabel('Email for booking verification').fill('accessory-test@example.com');
  await guest.locator('[name=agreement]').check();
  await expect(guest.getByRole('button', { name: 'Confirm Booking · Pay at Shop' })).toBeEnabled();
  await guest.getByRole('button', { name: 'Confirm Booking · Pay at Shop' }).click();
  await expect(guest.locator('.price-breakdown')).toContainText('Phone holder × 2');
  await expect(guest.locator('.price-breakdown')).toContainText('₹31');
  await card('Phone holder').getByRole('button', { name: 'Edit', exact: true }).click();
  await dialog().locator('[name=rate]').fill('20');
  await save();
  await guest.reload();
  await expect(guest.locator('.price-breakdown')).toContainText('₹31');
  await page.goto(base + '/admin/bookings');
  await page
    .getByRole('row')
    .filter({ hasText: 'Generic Accessory Tester' })
    .getByRole('button', { name: 'Manage' })
    .click();
  await expect(page.getByLabel('Booked helmets and add-ons')).toContainText('Phone holder × 2');
  await expect(page.getByLabel('Booked helmets and add-ons')).toContainText('₹31');
  await page.keyboard.press('Escape');
  await page.goto(base + '/admin/addons');
  console.log(
    'PASS generic add-on appears dynamically; eligibility, quantity cap, pause/enable, customer/admin receipts and unchanged confirmed charges after rate edit.',
  );
  await page.getByRole('textbox', { name: 'Search add-ons' }).fill('phone');
  await expect(page.locator('.admin-addons__grid .admin-addon')).toHaveCount(1);
  page.once('dialog', (confirmation) => confirmation.dismiss());
  await card('Phone holder').getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(card('Phone holder')).toBeVisible();
  page.once('dialog', (confirmation) => confirmation.accept());
  await card('Phone holder').getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(card('Phone holder')).toHaveCount(0);
  await page.getByLabel(/^Status/).selectOption('archived');
  await expect(card('Phone holder').locator('.admin-addon__status')).toHaveText('Archived');
  await expect(card('Phone holder').getByRole('button', { name: 'Edit', exact: true })).toHaveCount(
    0,
  );
  await page.getByRole('textbox', { name: 'Search add-ons' }).fill('');
  await page.getByLabel(/^Status/).selectOption('current');
  await card('Extra helmets').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(dialog()).toHaveCount(0);
  await expect(
    card('Extra helmets').getByRole('button', { name: 'Edit', exact: true }),
  ).toBeFocused();
  // A concurrent Admin update must not be overwritten by a stale editor.
  await card('Extra helmets').getByRole('button', { name: 'Edit', exact: true }).click();
  await run(db, 'UPDATE addons SET version=version+1 WHERE id=?', id);
  await dialog().getByRole('button', { name: 'Save Settings' }).click();
  await expect(dialog().getByRole('alert')).toContainText('changed');
  await dialog().getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.reload();
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['light', 'dark']) {
      const current = await page.locator('html').getAttribute('data-theme');
      if (current !== theme)
        await page.getByRole('button', { name: `Switch to ${theme} theme` }).click();
      await page.waitForTimeout(550);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `page overflow ${width} ${theme}`,
      );
      await card('Extra helmets').getByRole('button', { name: 'Edit', exact: true }).click();
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `editor overflow ${width} ${theme}`,
      );
      const box = await dialog().boundingBox();
      assert.ok(box.width <= width, `dialog wider than viewport ${width}`);
      await page.screenshot({ path: `${screenshotDir}/${width}-${theme}.png` });
      await dialog().getByRole('button', { name: 'Cancel', exact: true }).click();
      console.log('PASS admin page/editor', width, theme);
    }
  }
  const staffPage = await browser.newPage();
  await login(staffPage, 'addons-staff-e2e@riderent.local');
  await expect(staffPage).toHaveURL(base + '/admin');
  await expect(staffPage.getByRole('link', { name: 'Helmets & Add-ons', exact: true })).toHaveCount(
    0,
  );
  await expect(staffPage.getByRole('link', { name: 'Helmets', exact: true })).toHaveCount(0);
  assert.deepEqual(errors, []);
  console.log(
    'PASS admin create/edit/reload, exact paise, included units, live customer quotes, pause/enable, search/filter, archive confirmation, stale edit conflict, Escape/focus restoration, staff guards, responsive themes and no runtime errors.',
  );
} catch (error) {
  await page.screenshot({ path: screenshotDir + '/failure.png', fullPage: true });
  console.log('FAILED URL', page.url());
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await db.close();
}
