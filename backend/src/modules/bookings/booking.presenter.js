import { now } from '../../utils/dateTime.js';

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
    refunded: refunds.reduce((sum, refund) => sum + refund.amount, 0),
  }));
  const netPaid = (purpose) =>
    payments
      .filter((payment) => payment.purpose === purpose)
      .reduce((sum, payment) => sum + payment.amount - payment.refunded, 0);
  const rentalTotal =
    booking.status === 'cancelled' ? 0 : booking.base + booking.tax + booking.extra;
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
    overdue: booking.status === 'active' && booking.ends_at < now(),
    access_hash: undefined,
  };
}
