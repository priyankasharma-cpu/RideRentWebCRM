import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
if (process.env.RIDERENT_E2E_MODE !== 'isolated')
  throw Error('Run this scenario with npm run test:ui or npm run test:layout.');
const browser = await chromium.launch({
  headless: true,
  channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const base = process.env.TEST_BASE_URL;
const errors = [];
const serverErrors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('response', (r) => {
  if (r.url().startsWith(base) && r.status() >= 500) serverErrors.push(r.status() + ' ' + r.url());
});
try {
  await page.goto(base + '/admin', { waitUntil: 'networkidle' });
  await page.getByLabel('Email address').fill(process.env.ADMIN_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(process.env.ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign In to Workspace' }).click();
  await expect(page.locator('.admin-page-title')).toBeVisible();
  await page.getByRole('button', { name: 'Toggle admin navigation' }).click();
  await expect(page.locator('.admin-app')).toHaveClass(/collapsed/);
  await page.getByRole('button', { name: 'Toggle admin navigation' }).click();
  await expect(page.locator('.admin-app')).not.toHaveClass(/collapsed/);
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1050 });
    for (const route of [
      '/',
      '/vehicles',
      '/vehicles/honda-activa-6g',
      '/admin',
      '/admin/vehicles',
      '/admin/create-booking',
      '/admin/analytics',
      '/admin/settings',
    ]) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        'Horizontal overflow: ' + route + ' at ' + width,
      );
      assert.equal(await page.locator('.error-box').count(), 0, 'API error on ' + route);
      if (width === 1440 && (route === '/' || route === '/admin')) {
        const dark = await page.getByRole('button', { name: 'Switch to light theme' }).count();
        if (dark) await page.getByRole('button', { name: 'Switch to light theme' }).click();
        await page.screenshot({
          path:
            'backend/.artifacts/screenshots/' +
            (route === '/admin' ? 'admin-' : '') +
            'light-desktop.png',
          fullPage: true,
        });
        await page.getByRole('button', { name: 'Switch to dark theme' }).click();
        await page.screenshot({
          path:
            'backend/.artifacts/screenshots/' +
            (route === '/admin' ? 'admin-' : '') +
            'dark-desktop.png',
          fullPage: true,
        });
      }
      if (width === 390 && route === '/admin')
        await page.screenshot({
          path: 'backend/.artifacts/screenshots/admin-mobile.png',
          fullPage: true,
        });
    }
    console.log(
      'PASS built application layouts at ' +
        width +
        'px: homepage, fleet, details and admin overview/fleet/booking/analytics/settings.',
    );
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(serverErrors, []);
  console.log(
    'PASS built application: desktop sidebar collapse, mobile/tablet layouts, no runtime or server errors.',
  );
} catch (e) {
  await page.screenshot({
    path: 'backend/.artifacts/screenshots/layout-failure.png',
    fullPage: true,
  });
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
