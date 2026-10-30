import { all } from '../../config/database.js';
export async function listBookingRecordsVariant2(db) {
  return await all(db, 'SELECT * FROM bookings');
}
export async function listVehicleRecordsVariant3(db) {
  return await all(db, 'SELECT * FROM vehicles');
}
export async function listRefundRecords(db) {
  return await all(
    db,
    "SELECT p.*,COALESCE((SELECT SUM(amount) FROM refunds WHERE payment_id=p.id),0) refunded FROM payments p WHERE purpose='rental'",
  );
}
export async function listRentalRecords(db) {
  return await all(
    db,
    'SELECT r.*,b.vehicle_id FROM rentals r JOIN bookings b ON b.id=r.booking_id',
  );
}
