import assert from 'node:assert/strict';
import { test } from 'node:test';
import { navigationGroups, canAccessAdminLink } from '../src/config/adminNavigation.js';
import { money, paise, reportPath, searchParams } from '../src/admin/finance/financeModel.js';

test('finance sidebar exposes eight distinct routes to admins only', () => {
  const finance = navigationGroups.find((group) => group.label === 'Finance Management');
  assert.ok(finance.expandable);
  assert.equal(new Set(finance.links.map(([, route]) => route)).size, 8);
  for (const [, route] of finance.links) {
    assert.equal(canAccessAdminLink(route, 'admin'), true);
    assert.equal(canAccessAdminLink(route, 'staff'), false);
  }
  assert.equal(canAccessAdminLink('payments', 'staff'), true);
});

test('currency input converts to exact paise and renders in Indian digit groups', () => {
  assert.equal(paise('0001.01'), 101);
  assert.equal(paise('251.5'), 25150);
  assert.equal(paise('-0.01'), -1);
  assert.throws(() => paise('1.001'));
  assert.throws(() => paise('1e3'));
  assert.throws(() => paise('1000000.01'));
  assert.equal(money(12345678), '₹1,23,456.78');
  assert.equal(money(-1), '-₹0.01');
  assert.equal(money(Number.MAX_SAFE_INTEGER), '₹9,00,71,99,25,47,409.91');
});

test('filter serialization preserves active values and safely encodes searches', () => {
  assert.equal(
    searchParams({ period: 'today', source: '', category: null, page: 1 }),
    'period=today&page=1',
  );
  assert.equal(
    reportPath({ source: 'walk_in', search: 'RR & Co', format: 'xlsx' }),
    '/admin/finance/reports/export?source=walk_in&search=RR+%26+Co&format=xlsx',
  );
});
