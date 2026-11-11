import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  periodFromParams,
  validateRentalPeriod,
  periodSearch,
  shopInput,
} from '../src/utils/rentalTime.js';
import { verifiedCheckoutSelections } from '../src/utils/checkoutSelections.js';

const tomorrow = new Date(Math.ceil((Date.now() + 86400000) / 60000) * 60000);
const period = {
  startsAt: shopInput(tomorrow),
  endsAt: shopInput(new Date(+tomorrow + 4 * 3600000)),
};
test('local rental dates round-trip through shareable URLs and UTC availability requests', () => {
  const params = new URLSearchParams(periodSearch(period).slice(1));
  assert.deepEqual(periodFromParams(params), period);
  const result = validateRentalPeriod(period);
  assert.equal(result.error, '');
  assert.equal(result.window.startsAt, tomorrow.toISOString());
});
test('UTC URL dates normalize to the same India-local form interval', () => {
  const utc = validateRentalPeriod(period).window;
  assert.deepEqual(periodFromParams(new URLSearchParams(utc)), period);
  const invalid = periodFromParams(
    new URLSearchParams({ startsAt: '2030-02-30T10:00:00Z', endsAt: '2030-03-02T10:00:00Z' }),
  );
  assert.equal(validateRentalPeriod(invalid).window, null);
});
test('partial, reversed, impossible and past intervals are rejected before availability requests', () => {
  assert.equal(periodFromParams(new URLSearchParams({ startsAt: period.startsAt })).endsAt, '');
  for (const value of [
    { startsAt: period.startsAt, endsAt: '' },
    { startsAt: period.endsAt, endsAt: period.startsAt },
    { startsAt: '2030-02-30T10:00', endsAt: '2030-03-01T12:00' },
    { startsAt: '2020-01-01T10:00', endsAt: '2020-01-01T12:00' },
  ])
    assert.equal(validateRentalPeriod(value).window, null);
});
test('zero stock and unverified stock never default a URL selection to one', () => {
  const selections = [{ vehicleId: 'physical-1', quantity: null }];
  assert.equal(
    verifiedCheckoutSelections(selections, [{ unitIds: ['physical-1'], available: 0 }], true)[0]
      .quantity,
    0,
  );
  assert.equal(
    verifiedCheckoutSelections(selections, [{ unitIds: ['physical-1'], available: 2 }], false)[0]
      .quantity,
    0,
  );
  assert.equal(
    verifiedCheckoutSelections(selections, [{ unitIds: ['physical-1'], available: 2 }], true)[0]
      .quantity,
    1,
  );
});
test('quantity changes never exceed verified physical inventory and missing records remain zero', () => {
  const selected = [
    { vehicleId: 'physical-1', quantity: 4 },
    { vehicleId: 'missing', quantity: 1 },
  ];
  assert.deepEqual(
    verifiedCheckoutSelections(selected, [{ unitIds: ['physical-1'], available: 2 }], true),
    [
      { vehicleId: 'physical-1', quantity: 2 },
      { vehicleId: 'missing', quantity: 0 },
    ],
  );
});
