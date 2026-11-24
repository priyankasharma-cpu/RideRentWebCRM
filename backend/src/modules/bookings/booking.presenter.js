import { bookingStates } from './booking.status.js';

const isSettled = ({ status }) =>
  status == null || ['completed', 'succeeded', 'paid', 'success'].includes(status);

export function presentBooking(graph, { privateData = true } = {}) {
  const {
    vehicle,
    customer,
    contact,
    rental: rentalGraph,
    payments: paymentGraphs,
    ...booking
  } = graph;
  const payments = paymentGraphs.map(({ refunds, ...payment }) => ({
    ...payment,
    submission_payload: undefined,
    submission_key: undefined,
    reference_key: undefined,
    refunded: refunds.filter(isSettled).reduce((sum, refund) => sum + refund.amount, 0),
  }));
  const netPaid = (purpose) =>
    payments
      .filter((payment) => payment.purpose === purpose && isSettled(payment))
      .reduce((sum, payment) => sum + payment.amount - payment.refunded, 0);
  const rentalTotal =
    booking.status === 'cancelled'
      ? 0
      : booking.base +
        booking.tax +
        booking.extra -
        (booking.discount || 0) +
        (booking.addons || []).reduce((sum, addon) => sum + addon.base + addon.tax, 0);
  const closed = ['cancelled', 'completed'].includes(booking.status);
  const depositDue = closed ? 0 : booking.deposit;
  const rentalPaid = netPaid('rental');
  const depositPaid = netPaid('deposit');
  const { inspections = [], ...rental } = rentalGraph || {};

  return {
    ...booking,
    vehicle,
    customer: privateData ? { ...customer, ...(contact || {}) } : { name: customer.name },
    rental: rentalGraph ? rental : undefined,
    inspections,
    payments,
    rentalTotal,
    total: rentalTotal + depositDue,
    rentalPaid,
    depositPaid,
    outstanding: Math.max(0, rentalTotal - rentalPaid) + Math.max(0, depositDue - depositPaid),
    refundableDeposit: closed ? depositPaid : 0,
    ...bookingStates({
      status: booking.status,
      rentalTotal,
      rentalPaid,
      depositPaid,
      depositDue,
      endsAt: booking.ends_at,
      returnAt: rental.return_at,
    }),
    access_hash: undefined,
  };
}
