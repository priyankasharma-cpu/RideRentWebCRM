import { collection, mongoOptions, withTransaction } from '../../config/mongoDatabase.js';
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
import { cancellationFeeBalance } from '../finance/finance.balance.js';

async function prepareReceipt(db, name, input, entityId, entityField, method) {
  const receipts = collection(db, name);
  const { submissionKey, reference, ...details } = input;
  const fingerprint = JSON.stringify({ entityId, ...details, reference });
  if (submissionKey) {
    const existing = await receipts.findOne({ submission_key: submissionKey }, mongoOptions(db));
    if (existing) {
      if (existing[entityField] !== entityId || existing.submission_payload !== fingerprint)
        fail(409, 'Submission key was already used.');
      return null;
    }
  }
  const referenceKey = reference && method + ':' + reference.toUpperCase();
  if (referenceKey && (await receipts.findOne({ reference_key: referenceKey }, mongoOptions(db))))
    fail(409, 'This payment reference was already recorded for the method.');
  return {
    ...(submissionKey ? { submission_key: submissionKey, submission_payload: fingerprint } : {}),
    ...(referenceKey ? { reference_key: referenceKey, reference_number: reference } : {}),
  };
}
export async function recordPayment(db, request) {
  const input = request.body;
  await withTransaction(db, async () => {
    const b = await bookingView(db, request.params.id);
    const metadata = await prepareReceipt(db, 'payments', input, b.id, 'booking_id', input.method);
    if (!metadata) return;
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
      metadata,
    );
    await audit(db, request.user.id, 'payment.recorded', b.id, input);
  });
  return await bookingView(db, request.params.id);
}
export async function refundPayment(db, request) {
  const input = request.body;
  await withTransaction(db, async () => {
    const p = await findPaymentById(db, request.params.id);
    if (!p) fail(404, 'Payment not found.');
    const metadata = await prepareReceipt(db, 'refunds', input, p.id, 'payment_id', p.method);
    if (!metadata) return;
    if (p.status && !['completed', 'paid', 'succeeded', 'success'].includes(p.status))
      fail(409, 'Only completed payments can be refunded.');
    const b = await bookingView(db, p.booking_id);
    if (!['completed', 'cancelled'].includes(b.status))
      fail(409, 'Refunds are available after completion or cancellation.');
    const paid = b.payments.find((v) => v.id === p.id);
    if (input.amount > paid.amount - paid.refunded)
      fail(400, 'Refund exceeds the remaining payment.');
    if (p.purpose === 'rental' && b.status === 'completed')
      fail(409, 'Completed rental charges are earned; only deposit refunds are supported.');
    if (p.purpose === 'rental') {
      const retained = await cancellationFeeBalance(db, b.id);
      if (retained > 0 && b.rentalPaid - input.amount < retained)
        fail(409, 'Reverse the recognized cancellation fee before refunding the retained amount.');
    }
    await insertRefund(
      db,
      id(),
      p.id,
      input.amount,
      input.reason,
      request.user.id,
      now(),
      metadata,
    );
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
