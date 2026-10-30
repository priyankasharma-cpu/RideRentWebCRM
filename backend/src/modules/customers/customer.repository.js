import { all, get, run } from '../../config/database.js';
export async function listCustomerRecords(db) {
  return await all(db, 'SELECT * FROM customers ORDER BY created_at DESC');
}
export async function listBookingRecordsByCustomerId(db, customerId) {
  return await all(db, 'SELECT * FROM bookings WHERE customer_id=?', customerId);
}
export async function findCustomerById(db, id) {
  return await get(db, 'SELECT id FROM customers WHERE id=?', id);
}
export async function updateCustomerByVerifiedAndId(db, verified, id) {
  return await run(db, 'UPDATE customers SET verified=? WHERE id=?', verified, id);
}
export async function updateBookingContactByVerifiedAndCustomerId(db, verified, id) {
  return await run(
    db,
    "UPDATE booking_contacts SET verified=? WHERE booking_id IN (SELECT id FROM bookings WHERE customer_id=? AND status='confirmed')",
    verified,
    id,
  );
}
