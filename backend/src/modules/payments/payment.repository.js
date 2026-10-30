import { findRecord } from '../../config/database.js';
import { run, all } from '../../config/database.js';
export async function insertPayment(
  db,
  idValue,
  bookingId,
  amount,
  purpose,
  method,
  note,
  id,
  nowValue,
) {
  return await run(
    db,
    'INSERT INTO payments VALUES(?,?,?,?,?,?,?,?)',
    idValue,
    bookingId,
    amount,
    purpose,
    method,
    note,
    id,
    nowValue,
  );
}
export async function findPaymentById(db, id) {
  return await findRecord(db, 'payment', 'id', id);
}
export async function insertRefund(db, idValue, paymentId, amount, reason, id, nowValue) {
  return await run(
    db,
    'INSERT INTO refunds VALUES(?,?,?,?,?,?)',
    idValue,
    paymentId,
    amount,
    reason,
    id,
    nowValue,
  );
}
export async function listRefundRecordsVariant2(db) {
  return await all(
    db,
    'SELECT p.*,b.reference,c.name customer_name,COALESCE((SELECT SUM(amount) FROM refunds WHERE payment_id=p.id),0) refunded FROM payments p JOIN bookings b ON b.id=p.booking_id JOIN customers c ON c.id=b.customer_id ORDER BY p.created_at DESC',
  );
}
export async function listRefundRecordsVariant3(db) {
  return await all(db, 'SELECT * FROM refunds ORDER BY created_at DESC');
}
