import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutAddOnSelections } from '../src/utils/checkoutSelections.js';
import { navigationGroups, canAccessAdminLink } from '../src/config/adminNavigation.js';

const models = [
  { unitIds: ['bike'], category: 'Bike' },
  { unitIds: ['car'], category: 'Car' },
];
const accessory = {
  id: 'raincoat',
  enabled: true,
  available: 7,
  maxQuantity: 5,
  categories: [{ category: 'Bike', includedQuantity: 1 }],
};
test('generic extras include free units, clamp paid selection and exclude unrelated categories', () => {
  const rows = checkoutAddOnSelections(
    [accessory],
    { raincoat: 9 },
    [{ vehicleId: 'bike', quantity: 2 }],
    models,
    true,
  );
  assert.equal(rows[0].included, 2);
  assert.equal(rows[0].maximum, 3);
  assert.equal(rows[0].paidQuantity, 3);
  assert.deepEqual(
    checkoutAddOnSelections(
      [accessory],
      { raincoat: 1 },
      [{ vehicleId: 'car', quantity: 1 }],
      models,
      true,
    ),
    [],
  );
  assert.deepEqual(
    checkoutAddOnSelections(
      [{ ...accessory, enabled: false }],
      { raincoat: 1 },
      [{ vehicleId: 'bike', quantity: 1 }],
      models,
      true,
    ),
    [],
  );
});
test('unverified extras retain presentation quantity but cannot increase; zero stock caps extras', () => {
  const rows = [{ vehicleId: 'bike', quantity: 1 }];
  const pending = checkoutAddOnSelections([accessory], { raincoat: 2 }, rows, models, false)[0];
  assert.equal(pending.maximum, 0);
  assert.equal(pending.paidQuantity, 2);
  assert.equal(
    checkoutAddOnSelections(
      [{ ...accessory, available: 0 }],
      { raincoat: 2 },
      rows,
      models,
      true,
    )[0].paidQuantity,
    0,
  );
  assert.deepEqual(checkoutAddOnSelections([], { raincoat: 2 }, rows, models, true), []);
});
test('one canonical add-on navigation entry, unique routes and explicit staff permissions', () => {
  const paths = navigationGroups.flatMap((group) => group.links.map(([, path]) => path));
  assert.equal(paths.filter((path) => path === 'addons').length, 1);
  assert.equal(paths.includes('helmets'), false);
  assert.equal(new Set(paths).size, paths.length);
  assert.equal(canAccessAdminLink('addons', 'staff'), false);
  assert.equal(canAccessAdminLink('vehicles', 'staff'), false);
  assert.equal(canAccessAdminLink('addons', 'admin'), true);
  assert.equal(canAccessAdminLink('bookings', 'staff'), true);
});
