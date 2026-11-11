import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  groupBookingVehicles,
  cartLines,
  updateCartQuantity,
  sumVehicleQuotes,
  rentalPeriodQuery,
} from '../src/utils/bookingCart.js';
const unit = (id, extra = {}) => ({
  id,
  name: 'Model A',
  category: 'Bike',
  image: '/images/example.webp',
  rate: 10000,
  available: true,
  ...extra,
});

test('display names do not create inventory; explicit model identity groups distinct units', () => {
  assert.equal(groupBookingVehicles([unit('a'), unit('b')]).length, 2);
  const groups = groupBookingVehicles([
    unit('a', { modelId: 'model' }),
    unit('b', { modelId: 'model' }),
    unit('b', { modelId: 'model' }),
    unit('c', { modelId: 'model', available: false }),
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].units.length, 3);
  assert.equal(groups[0].availableUnits.length, 2);
});
test('quantities cannot exceed available inventory; removal and lower unavailable quantity work', () => {
  const [group] = groupBookingVehicles([
    unit('a', { modelId: 'model' }),
    unit('b', { modelId: 'model' }),
  ]);
  let cart = updateCartQuantity([], group, 2);
  assert.deepEqual(cart, [{ key: 'model', quantity: 2 }]);
  assert.deepEqual(updateCartQuantity(cart, group, 3), cart);
  assert.equal(cartLines(cart, [group])[0].vehicles.length, 2);
  const unavailable = { ...group, availableUnits: [] };
  assert.equal(cartLines(cart, [unavailable])[0].available, false);
  assert.equal(updateCartQuantity(cart, unavailable, 1)[0].quantity, 1);
  assert.deepEqual(updateCartQuantity(cart, group, 0), []);
});
test('URL-selected physical unit transitions to its explicit model without duplicate allocations', () => {
  const [group] = groupBookingVehicles([
    unit('a', { modelId: 'model' }),
    unit('b', { modelId: 'model' }),
  ]);
  assert.equal(cartLines([{ key: 'a', quantity: 1 }], [group])[0].group.key, 'model');
  assert.deepEqual(updateCartQuantity([{ key: 'a', quantity: 1 }], group, 2), [
    { key: 'model', quantity: 2 },
  ]);
});
test('server quote aggregation keeps paise exact and refundable deposits separate', () => {
  const a = {
    hours: 4,
    roundingMinutes: 60,
    base: 40000,
    tax: 7200,
    deposit: 200000,
    total: 247200,
  };
  const b = { ...a, base: 20000, tax: 3600, deposit: 50000, total: 73600 };
  const before = JSON.stringify([a, b]);
  assert.deepEqual(sumVehicleQuotes([a, b]), {
    hours: 4,
    roundingMinutes: 60,
    base: 60000,
    tax: 10800,
    deposit: 250000,
    total: 320800,
  });
  assert.equal(JSON.stringify([a, b]), before);
  assert.throws(() => sumVehicleQuotes([{ ...a, total: 1.1 }]));
  assert.throws(() => sumVehicleQuotes([a, { ...b, hours: 5 }]));
});
test('IST window serializes correctly and rejects reversed or past requested schedules', () => {
  const period = { startsAt: '2099-01-02T10:00', endsAt: '2099-01-02T14:00' };
  const query = new URLSearchParams(rentalPeriodQuery(period));
  assert.equal(query.get('startsAt'), '2099-01-02T04:30:00.000Z');
  assert.throws(() => rentalPeriodQuery({ ...period, endsAt: '2099-01-02T09:00' }));
  assert.throws(() =>
    rentalPeriodQuery(
      { startsAt: '2020-01-01T10:00', endsAt: '2020-01-01T11:00' },
      { future: true },
    ),
  );
  // A previously applied window becoming past must return a backend error, not crash React rendering.
  assert.doesNotThrow(() =>
    rentalPeriodQuery({ startsAt: '2020-01-01T10:00', endsAt: '2020-01-01T11:00' }),
  );
});
