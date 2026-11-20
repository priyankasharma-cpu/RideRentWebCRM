import {
  collection,
  fromDocument,
  fromDocuments,
  mongoOptions,
  queryGroup,
} from '../../config/mongoDatabase.js';
import { listAllocationSnapshots } from '../addons/addOn.repository.js';

export const checkoutInstalled = async () => true;

export async function checkoutVehicles(db) {
  const rows = await collection(db, 'vehicles')
    .find({}, mongoOptions(db))
    .sort({ created_at: 1, id: 1 })
    .toArray();
  return fromDocuments(rows);
}

export async function previousCheckout(db, key) {
  return fromDocument(
    await collection(db, 'checkout_orders').findOne({ submission_key: key }, mongoOptions(db)),
  );
}

export async function orderBookingIds(db, orderId) {
  const rows = await collection(db, 'checkout_items')
    .find({ order_id: orderId }, mongoOptions(db))
    .sort({ _migration_order: 1 })
    .toArray();
  return rows.map((row) => ({ booking_id: row.booking_id }));
}

export async function saveCheckout(db, order) {
  await collection(db, 'checkout_orders').insertOne(
    {
      _id: order.id,
      id: order.id,
      submission_key: order.key,
      input_hash: order.inputHash,
      access_hash: order.accessHash,
      created_at: order.createdAt,
    },
    mongoOptions(db),
  );
}

export async function saveCheckoutItem(db, orderId, bookingId) {
  const position = await collection(db, 'checkout_items').countDocuments(
    { order_id: orderId },
    mongoOptions(db),
  );
  await collection(db, 'checkout_items').insertOne(
    {
      _id: bookingId,
      booking_id: bookingId,
      order_id: orderId,
      _migration_order: position,
    },
    mongoOptions(db),
  );
}

export async function checkoutExtras(db) {
  const [legacyAddons, allocationSnapshots, items] = await queryGroup(db, [
    () => collection(db, 'booking_addons').find({}, mongoOptions(db)).toArray(),
    () => listAllocationSnapshots(db),
    () =>
      collection(db, 'checkout_items')
        .find({}, mongoOptions(db))
        .sort({ order_id: 1, _migration_order: 1 })
        .toArray(),
  ]);
  const members = [];
  const bookings = items.length
    ? await collection(db, 'bookings')
        .find(
          { id: { $in: items.map((item) => item.booking_id) } },
          { ...mongoOptions(db), projection: { id: 1 } },
        )
        .toArray()
    : [];
  const bookingIds = new Set(bookings.map((booking) => booking.id));
  for (const item of items) {
    if (!bookingIds.has(item.booking_id)) continue;
    members.push({
      order_id: item.order_id,
      id: item.booking_id,
    });
  }
  return {
    addons: [
      ...fromDocuments(legacyAddons).map((row) => ({
        ...row,
        id: `legacy-${row.booking_id}`,
        name: 'Extra helmets',
        code: 'helmet',
        included_quantity: 0,
      })),
      ...allocationSnapshots,
    ],
    members,
  };
}
