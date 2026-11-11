import { all, get, run } from '../../config/database.js';
import { listAllocationSnapshots } from '../addons/addOn.repository.js';

export const checkoutInstalled = async (db) =>
  Boolean(
    await get(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='checkout_orders'"),
  );
export const checkoutVehicles = (db) => all(db, 'SELECT * FROM vehicles ORDER BY created_at,id');
export const previousCheckout = (db, key) =>
  get(db, 'SELECT * FROM checkout_orders WHERE submission_key=?', key);
export const orderBookingIds = (db, orderId) =>
  all(db, 'SELECT booking_id FROM checkout_items WHERE order_id=? ORDER BY rowid', orderId);
export const saveCheckout = (db, order) =>
  run(
    db,
    'INSERT INTO checkout_orders(id,submission_key,input_hash,access_hash,created_at) VALUES(?,?,?,?,?)',
    order.id,
    order.key,
    order.inputHash,
    order.accessHash,
    order.createdAt,
  );
export const saveCheckoutItem = (db, orderId, bookingId) =>
  run(db, 'INSERT INTO checkout_items(booking_id,order_id) VALUES(?,?)', bookingId, orderId);
export async function checkoutExtras(db) {
  if (!(await checkoutInstalled(db))) return { addons: [], members: [] };
  return {
    addons: [
      ...(await all(db, 'SELECT * FROM booking_addons')).map((row) => ({
        ...row,
        id: 'legacy-' + row.booking_id,
        name: 'Extra helmets',
        code: 'helmet',
        included_quantity: 0,
      })),
      ...(await listAllocationSnapshots(db)),
    ],
    members: await all(
      db,
      'SELECT i.order_id,b.id,b.reference,b.status,b.base,b.tax,b.deposit,b.extra,v.name FROM checkout_items i JOIN bookings b ON b.id=i.booking_id JOIN vehicles v ON v.id=b.vehicle_id ORDER BY i.rowid',
    ),
  };
}
