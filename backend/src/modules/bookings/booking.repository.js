import { findRecord } from '../../config/database.js';
import { get, run, all } from '../../config/database.js';
export async function findVehicleByIdVariant2(db, value1) {
  return await findRecord(db, 'vehicle', 'id', value1);
}
export async function findBookingByReferenceAndPhone(db, value1, phoneValue) {
  return await get(
    db,
    'SELECT b.* FROM bookings b JOIN customers c ON b.customer_id=c.id WHERE b.reference=? AND c.phone=?',
    value1,
    phoneValue,
  );
}
export async function updateBookingByAccessHashAndId(db, hashValue, bookingId) {
  return await run(db, 'UPDATE bookings SET access_hash=? WHERE id=?', hashValue, bookingId);
}
export async function findBookingById(db, id) {
  return await findRecord(db, 'booking', 'id', id);
}
export async function updateBookingById(db, bookingId) {
  return await run(db, "UPDATE bookings SET status='cancelled' WHERE id=?", bookingId);
}
export async function listBookingRecords(db) {
  return await all(db, 'SELECT * FROM bookings ORDER BY created_at DESC');
}
export async function findCustomerByPhone(db, phone) {
  return await findRecord(db, 'customer', 'phone', phone);
}
export async function insertCustomer(db, id, name, phone, email, value5, nowValue) {
  return await run(
    db,
    'INSERT INTO customers VALUES(?,?,?,?,?,?)',
    id,
    name,
    phone,
    email,
    value5,
    nowValue,
  );
}
export async function updateCustomerByNameAndEmailAndVerified(db, name, email, verified, id) {
  return await run(
    db,
    'UPDATE customers SET name=?,email=?,verified=? WHERE id=?',
    name,
    email,
    verified,
    id,
  );
}
export async function insertBooking(
  db,
  booking,
  reference,
  hashValue,
  id,
  vehicleId,
  start,
  end,
  hours,
  rate,
  base,
  tax,
  deposit,
  value13,
  value14,
  user,
  notes,
  nowValue,
) {
  return await run(
    db,
    'INSERT INTO bookings VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    booking,
    reference,
    hashValue,
    id,
    vehicleId,
    start,
    end,
    hours,
    rate,
    base,
    tax,
    deposit,
    value13,
    value14,
    user,
    notes,
    nowValue,
  );
}
export async function insertBookingContact(db, booking, name, phone, email, value5) {
  return await run(
    db,
    'INSERT INTO booking_contacts VALUES(?,?,?,?,?)',
    booking,
    name,
    phone,
    email,
    value5,
  );
}
export async function updateBookingByStartsAtAndEndsAtAndHours(
  db,
  start,
  end,
  hours,
  base,
  tax,
  bookingId,
) {
  return await run(
    db,
    'UPDATE bookings SET starts_at=?,ends_at=?,hours=?,base=?,tax=? WHERE id=?',
    start,
    end,
    hours,
    base,
    tax,
    bookingId,
  );
}
export async function findCustomerByIdVariant2(db, customer_id) {
  return await findRecord(db, 'customer', 'id', customer_id);
}
export async function findRentalByBookingIdVariant2(db, bookingId) {
  return await findRecord(db, 'rental', 'bookingId', bookingId);
}
export async function listRefundRecordsByBookingId(db, bookingId) {
  return await all(
    db,
    'SELECT p.*,COALESCE((SELECT SUM(amount) FROM refunds WHERE payment_id=p.id),0) refunded FROM payments p WHERE booking_id=? ORDER BY created_at DESC',
    bookingId,
  );
}
export async function findBookingContactByBookingId(db, bookingId) {
  return await get(
    db,
    'SELECT name,phone,email,verified FROM booking_contacts WHERE booking_id=?',
    bookingId,
  );
}
export async function listInspectionRecordsByRentalId(db, rentalId) {
  return await all(db, 'SELECT * FROM inspections WHERE rental_id=? ORDER BY created_at', rentalId);
}
