// Derived from receipts and actual handover records; no duplicate persisted status flags.
export function bookingStates(
  { status, rentalTotal, rentalPaid, depositPaid, depositDue, endsAt, returnAt },
  timestamp = Date.now(),
) {
  const outstanding = Math.max(0, rentalTotal - rentalPaid) + Math.max(0, depositDue - depositPaid);
  const received = rentalPaid + depositPaid;
  let paymentState = 'pending';
  if (status === 'cancelled') paymentState = received > 0 ? 'refund_pending' : 'not_required';
  else if (outstanding === 0) paymentState = rentalTotal + depositDue > 0 ? 'paid' : 'not_required';
  else if (received > 0) paymentState = 'partial';
  const overdue = status === 'active' && !returnAt && Date.parse(endsAt) <= timestamp;
  let rentalState = 'awaiting_pickup';
  if (status === 'cancelled') rentalState = 'cancelled';
  else if (returnAt) rentalState = 'returned';
  else if (status === 'completed') rentalState = 'closed';
  else if (overdue) rentalState = 'overdue';
  else if (status === 'active') rentalState = 'out';
  else if (status === 'confirmed' && Date.parse(endsAt) <= timestamp) rentalState = 'expired';
  return { paymentState, rentalState, overdue };
}
