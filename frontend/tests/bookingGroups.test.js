import test from 'node:test';
import assert from 'node:assert/strict';
import { groupBookingRows } from '../src/admin/utils/bookingGroups.js';

const member = (id, checkoutId, checkoutMembers, totalPayable) => ({
  id,
  reference: `RR-${id}`,
  customer: { name: 'Demo Customer' },
  checkout: {
    id: checkoutId,
    totalPayable,
    bookings: checkoutMembers,
  },
});

test('admin groups only rows sharing the persisted checkout id and keeps one member per booking', () => {
  const members = [
    { id: 'a', name: 'Creta', totalPayable: 20050 },
    { id: 'b', name: 'Nexon', totalPayable: 18760 },
    { id: 'c', name: 'Classic', totalPayable: 6600 },
  ];
  const groups = groupBookingRows([
    member('a', 'order-1', members, 45410),
    member('b', 'order-1', members, 45410),
    member('c', 'order-1', members, 45410),
    { id: 'unrelated', customer: { name: 'Other' }, checkout: undefined },
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].type, 'checkout');
  assert.equal(groups[0].id, 'order-1');
  assert.deepEqual(
    groups[0].members.map(({ id }) => id),
    ['a', 'b', 'c'],
  );
  assert.equal(groups[0].checkout.totalPayable, 45410);
  assert.equal(groups[1].type, 'booking');
  assert.equal(groups[1].booking.id, 'unrelated');
});

test('checkout groups retain distinct order ids instead of grouping by matching customer or vehicle', () => {
  const sameMembers = [{ id: 'a', name: 'Bike', totalPayable: 500 }];
  const rows = [
    member('a', 'order-1', sameMembers, 500),
    member('b', 'order-2', [{ id: 'b', name: 'Bike', totalPayable: 500 }], 500),
  ];

  assert.equal(groupBookingRows(rows).length, 2);
});
