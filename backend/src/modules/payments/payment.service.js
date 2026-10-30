import { transaction } from '../../config/database.js';
import { bookingView } from '../bookings/booking.read.service.js';
import { fail } from '../../utils/ApiError.js';
import {
  insertPayment,
  findPaymentById,
  insertRefund,
  listRefundRecordsVariant2,
  listRefundRecordsVariant3,
} from './payment.repository.js';
import { id } from '../../utils/crypto.js';
import { now } from '../../utils/dateTime.js';
import { audit } from '../audit/audit.service.js';
export async function recordPayment(db, request) {
  const input = request.body;
  await transaction(db, async () => {
    const b = await bookingView(db, request.params.id);
    if (b.status === 'cancelled') fail(409, 'Cannot receive payment for a cancelled booking.');
    const due =
      input.purpose === 'rental'
        ? b.rentalTotal - b.rentalPaid
        : (b.status === 'completed' ? 0 : b.deposit) - b.depositPaid;
    if (input.amount > due) fail(400, 'Payment exceeds the outstanding amount for this purpose.');
    await insertPayment(
      db,
      id(),
      b.id,
      input.amount,
      input.purpose,
      input.method,
      input.note,
      request.user.id,
      now(),
    );
    await audit(db, request.user.id, 'payment.recorded', b.id, input);
  });
  return await bookingView(db, request.params.id);
}
export async function refundPayment(db, request) {
  const input = request.body;
  await transaction(db, async () => {
    const p = await findPaymentById(db, request.params.id);
    if (!p) fail(404, 'Payment not found.');
    const b = await bookingView(db, p.booking_id);
    if (!['completed', 'cancelled'].includes(b.status))
      fail(409, 'Refunds are available after completion or cancellation.');
    const paid = b.payments.find((v) => v.id === p.id);
    if (input.amount > paid.amount - paid.refunded)
      fail(400, 'Refund exceeds the remaining payment.');
    if (p.purpose === 'rental' && b.status === 'completed')
      fail(409, 'Completed rental charges are earned; only deposit refunds are supported.');
    await insertRefund(db, id(), p.id, input.amount, input.reason, request.user.id, now());
    await audit(db, request.user.id, 'payment.refunded', p.booking_id, input);
  });
  return {
    ok: true,
  };
}
export async function listPayments(db, _request) {
  return {
    payments: await listRefundRecordsVariant2(db),
    refunds: await listRefundRecordsVariant3(db),
  };
}
