import { chromium, expect } from '../../node_modules/@playwright/test/index.mjs';
import { openDb } from '../../src/config/database.js';
import { seed } from '../../prisma/seed.js';
import { createApp } from '../../src/app.js';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// Every write is confined to this disposable database.
process.env.ADMIN_EMAIL = 'typography-test@riderent.local';
process.env.ADMIN_PASSWORD = randomBytes(20).toString('hex');
const db = await openDb(':memory:');
await seed(db);
const origins = [];
const server = createApp(db, { origins }).listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
origins.push(base);
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
const out = 'backend/.artifacts/admin-typography';
mkdirSync(out, { recursive: true });
const metrics = [];
async function theme(value) {
  if ((await page.locator('html').getAttribute('data-theme')) !== value)
    await page.getByRole('button', { name: `Switch to ${value} theme` }).click();
  await page.waitForTimeout(350); // Let existing theme transitions settle before visual checks.
}
async function noOverflow(route, width) {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    `page overflow ${route} at ${width}`,
  );
}
async function customerMetrics() {
  return page
    .locator('.vehicle-card')
    .first()
    .evaluate((el) => ({
      cardWidth: el.getBoundingClientRect().width,
      title: globalThis.getComputedStyle(el.querySelector('h3')).fontSize,
      body: globalThis.getComputedStyle(document.body).fontSize,
      headerHeight: document.querySelector('header').getBoundingClientRect().height,
    }));
}
try {
  await page.goto(base + '/vehicles', { waitUntil: 'networkidle' });
  await theme('light');
  await expect(page.locator('.vehicle-card').first()).toBeVisible();
  const customerBefore = await customerMetrics();
  await page.goto(base + '/admin');
  await page.getByLabel('Email address').fill(process.env.ADMIN_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(process.env.ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign In to Workspace' }).click();
  await expect(page.locator('.admin-page-title h1')).toBeVisible();
  const routes = [
    '',
    'bookings',
    'create-booking',
    'vehicles',
    'availability',
    'maintenance',
    'active-rentals',
    'returns',
    'customers',
    'payments',
    'addons',
    'analytics',
    'settings',
    'staff',
    'inquiries',
  ];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      await page.goto(base + '/admin' + (route ? '/' + route : ''), { waitUntil: 'networkidle' });
      await expect(page.locator('.admin-page-title h1')).toBeVisible();
      for (const value of ['light', 'dark']) {
        await theme(value);
        await noOverflow(route, width);
        if (route === '')
          await expect(page.locator('.overview-callout--overdue')).toHaveCSS(
            'background-image',
            'none',
          );
        if (route === 'bookings' && width === 1440) {
          const contrasts = await page
            .locator('td .status, .page-title-actions .rr-button')
            .evaluateAll((nodes) => {
              const ctx = document.createElement('canvas').getContext('2d');
              const rgb = (color) => {
                ctx.clearRect(0, 0, 1, 1);
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 1, 1);
                return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
              };
              const luminance = (values) =>
                values
                  .map((v) => v / 255)
                  .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
                  .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
              return nodes.map((node) => {
                const css = globalThis.getComputedStyle(node);
                const a = luminance(rgb(css.color)),
                  b = luminance(rgb(css.backgroundColor));
                return {
                  label: node.textContent,
                  ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
                };
              });
            });
          assert.ok(
            contrasts.every((item) => item.ratio >= 4.5),
            JSON.stringify({ theme: value, contrasts }),
          );
          metrics.push({ theme: value, statusContrasts: contrasts });
        }
        const font = await page
          .locator('.admin-page-title h1')
          .evaluate((el) => parseFloat(globalThis.getComputedStyle(el).fontSize));
        assert.ok(font >= (width < 750 ? 26 : 30), `small heading ${route}`);
        if (['', 'bookings', 'addons', 'settings'].includes(route))
          await page.screenshot({
            path: `${out}/${route || 'dashboard'}-${width}-${value}.png`,
            fullPage: true,
          });
      }
      assert.equal(
        await page.locator('.admin-content .error-box').count(),
        0,
        `API error ${route}`,
      );
    }
    console.log('PASS all admin routes, themes, headings and page overflow', width);
  }
  for (const width of [1920, 1280, 1024, 768, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      'bookings',
      'vehicles',
      'create-booking',
      'addons',
      'analytics',
      'settings',
    ]) {
      await page.goto(base + '/admin/' + route, { waitUntil: 'networkidle' });
      await noOverflow(route, width);
      if (route === 'bookings') {
        const data = await page
          .locator('tbody tr')
          .first()
          .evaluate((row) => ({
            primary: parseFloat(globalThis.getComputedStyle(row.querySelector('strong')).fontSize),
            secondary: parseFloat(globalThis.getComputedStyle(row.querySelector('small')).fontSize),
            height: row.getBoundingClientRect().height,
            header: parseFloat(globalThis.getComputedStyle(document.querySelector('th')).fontSize),
          }));
        assert.ok(data.primary >= 14 && data.secondary >= 12 && data.header >= 12);
        // Schedule duration and separate payment badges add a meaningful third line.
        assert.ok(data.height >= 72 && data.height <= 140);
        await expect(page.locator('tbody tr').first()).toContainText('Duration:');
        await expect(
          page.locator('tbody tr').first().getByLabel('Payment status', { exact: true }),
        ).toBeVisible();
        metrics.push({ width, ...data });
        await page.screenshot({ path: `${out}/bookings-${width}.png`, fullPage: true });
      }
    }
    console.log('PASS responsive controls and readable table', width);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + '/admin/bookings', { waitUntil: 'networkidle' });
  assert.equal(
    await page
      .locator('.admin-sidebar')
      .evaluate((el) => Math.round(el.getBoundingClientRect().width)),
    280,
  );
  const nav = await page
    .locator('.admin-sidebar nav a')
    .first()
    .evaluate((el) => ({
      font: parseFloat(globalThis.getComputedStyle(el).fontSize),
      height: el.getBoundingClientRect().height,
    }));
  assert.ok(nav.font >= 15 && nav.height >= 44);
  await page.getByRole('button', { name: 'Toggle admin navigation' }).click();
  await expect(page.locator('.admin-app')).toHaveClass(/collapsed/);
  assert.equal(
    await page
      .locator('.admin-sidebar')
      .evaluate((el) => Math.round(el.getBoundingClientRect().width)),
    84,
  );
  await page.getByRole('button', { name: 'Toggle admin navigation' }).click();
  const search = page.getByRole('textbox', { name: 'Search bookings' });
  await search.fill('NO-MATCH-TYPOGRAPHY');
  await expect(page.locator('tbody tr')).toHaveCount(0);
  await search.fill('');
  await expect(page.locator('tbody tr').first()).toBeVisible();
  await page.getByLabel('Filter booking status').selectOption('completed');
  await expect(page.locator('tbody tr').first()).toBeVisible();
  assert.ok(
    (await page.locator('tbody .status').allTextContents()).every((value) => value === 'completed'),
  );
  await page.getByLabel('Filter booking status').selectOption('All');
  await page.getByLabel('Filter booking source').selectOption('Phone');
  await expect(page.locator('tbody tr').first()).toBeVisible();
  assert.ok(
    (await page.locator('tbody .source-badge').allTextContents()).every(
      (value) => value === 'Phone',
    ),
  );
  await page.getByLabel('Filter booking source').selectOption('All');
  await page.getByRole('button', { name: 'Manage' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: out + '/booking-dialog.png' });
  await page.keyboard.press('Escape');
  await page.goto(base + '/admin/vehicles');
  await page.getByRole('button', { name: 'Add Vehicle' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const input = page.getByRole('dialog').locator('input').first();
  const inputMetrics = await input.evaluate((el) => ({
    font: parseFloat(globalThis.getComputedStyle(el).fontSize),
    height: el.getBoundingClientRect().height,
  }));
  assert.ok(inputMetrics.font >= 14 && inputMetrics.height >= 44);
  await page.keyboard.press('Escape');
  await page.goto(base + '/vehicles', { waitUntil: 'networkidle' });
  await theme('light');
  assert.deepEqual(await customerMetrics(), customerBefore);
  assert.deepEqual(errors, []);
  writeFileSync(
    out + '/metrics.json',
    JSON.stringify(
      {
        nav,
        input: inputMetrics,
        tables: metrics,
        customerBefore,
        customerAfter: await customerMetrics(),
      },
      null,
      2,
    ),
  );
  console.log(
    'PASS collapse/navigation, booking search/action, form metrics, unchanged customer CSS and no runtime errors.',
  );
} catch (error) {
  await page.screenshot({ path: out + '/failure.png', fullPage: true });
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await db.close();
}
