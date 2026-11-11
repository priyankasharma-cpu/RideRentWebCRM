import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  stepCheckoutSelection,
  removeCheckoutSelection,
  helmetSelectionLimits,
  stepBoundedQuantity,
} from '../src/utils/checkoutSelections.js';

test('quantity steps use current state, cap real stock, and remove only the zero target', () => {
  let rows = [
    { vehicleId: 'a', quantity: null },
    { vehicleId: 'b', quantity: 0 },
  ];
  rows = stepCheckoutSelection(rows, 'a', 1, 3, 1);
  rows = stepCheckoutSelection(rows, 'a', 1, 3, 2);
  rows = stepCheckoutSelection(rows, 'a', 1, 3, 3);
  assert.deepEqual(rows, [
    { vehicleId: 'a', quantity: 3 },
    { vehicleId: 'b', quantity: 0 },
  ]);
  for (let i = 0; i < 3; i++) rows = stepCheckoutSelection(rows, 'a', -1, 3, 3 - i);
  assert.deepEqual(rows, [{ vehicleId: 'b', quantity: 0 }]);
  assert.deepEqual(removeCheckoutSelection(rows, 'b'), []);
});
test('one-unit and zero-unit stock cannot be incremented; changed stock is respected', () => {
  assert.deepEqual(stepCheckoutSelection([{ vehicleId: 'a', quantity: 1 }], 'a', 1, 1, 1), [
    { vehicleId: 'a', quantity: 1 },
  ]);
  assert.deepEqual(stepCheckoutSelection([{ vehicleId: 'a', quantity: 0 }], 'a', 1, 0, 0), [
    { vehicleId: 'a', quantity: 0 },
  ]);
  assert.deepEqual(stepCheckoutSelection([{ vehicleId: 'a', quantity: 8 }], 'a', -1, 3, 3), [
    { vehicleId: 'a', quantity: 2 },
  ]);
});
test('paid helmet limits reserve included units and exclude unselected categories', () => {
  const helmet = {
    enabled: true,
    available: 6,
    maxQuantity: 5,
    categories: [{ category: 'Bike', includedQuantity: 1 }],
  };
  const models = [{ unitIds: ['a'], category: 'Bike' }];
  assert.deepEqual(helmetSelectionLimits(helmet, [{ vehicleId: 'a', quantity: 2 }], models, true), {
    included: 2,
    eligible: true,
    maximum: 3,
  });
  assert.equal(
    helmetSelectionLimits(helmet, [{ vehicleId: 'a', quantity: 0 }], models, true).maximum,
    0,
  );
  assert.equal(helmetSelectionLimits(undefined, [], models, true).maximum, 0);
  assert.equal(
    helmetSelectionLimits(helmet, [{ vehicleId: 'a', quantity: 2 }], models, false).maximum,
    0,
  );
  assert.equal(stepBoundedQuantity(3, 1, 3), 3);
  assert.equal(stepBoundedQuantity(0, -1, 3), 0);
});
