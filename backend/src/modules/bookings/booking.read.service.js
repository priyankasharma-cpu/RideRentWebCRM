import { findBookingGraph, listBookingGraphs } from './bookingGraph.repository.js';
import { presentBooking } from './booking.presenter.js';
import { fail } from '../../utils/ApiError.js';
import { checkoutExtras } from './checkout.repository.js';

function withAddOns(graph, extras) {
  if (!graph) return graph;
  return {
    ...graph,
    addons: extras.addons.filter((row) => row.booking_id === graph.id),
  };
}

function presentMember(booking) {
  const cancelled = booking.status === 'cancelled';
  const addOns = (booking.addons || []).map((addon) => ({
    name: addon.name,
    quantity: addon.quantity,
    includedQuantity: addon.included_quantity || 0,
    paidQuantity: Math.max(0, addon.quantity - (addon.included_quantity || 0)),
    base: cancelled ? 0 : addon.base,
    tax: cancelled ? 0 : addon.tax,
  }));
  const addOnTax = addOns.reduce((sum, addon) => sum + addon.tax, 0);
  const amountRefunded = booking.payments.reduce((sum, payment) => sum + payment.refunded, 0);

  return {
    id: booking.id,
    reference: booking.reference,
    name: booking.vehicle.name,
    status: booking.status,
    rentalCharge: cancelled ? 0 : booking.base + booking.extra,
    tax: cancelled ? 0 : booking.tax + addOnTax,
    addOns,
    securityDeposit: booking.deposit,
    depositPaid: booking.depositPaid,
    refundableDeposit: booking.refundableDeposit,
    totalPayable: booking.total,
    amountPaid: booking.rentalPaid + booking.depositPaid,
    amountRefunded,
    outstanding: booking.outstanding,
    paymentState: booking.paymentState,
  };
}

export function summarizeCheckout(orderId, members) {
  const bookings = members.map(presentMember);
  const totalPayable = bookings.reduce((sum, booking) => sum + booking.totalPayable, 0);
  const amountPaid = bookings.reduce((sum, booking) => sum + booking.amountPaid, 0);
  const amountRefunded = bookings.reduce((sum, booking) => sum + booking.amountRefunded, 0);
  const outstanding = bookings.reduce((sum, booking) => sum + booking.outstanding, 0);
  const securityDeposit = bookings.reduce((sum, booking) => sum + booking.securityDeposit, 0);
  const refundableDeposit = bookings.reduce((sum, booking) => sum + booking.refundableDeposit, 0);
  const paymentState = bookings.some((booking) => booking.paymentState === 'refund_pending')
    ? 'refund_pending'
    : outstanding > 0
      ? amountPaid > 0
        ? 'partial'
        : 'pending'
      : totalPayable + amountPaid > 0
        ? 'paid'
        : 'not_required';

  return {
    id: orderId,
    bookings,
    total: totalPayable,
    totalPayable,
    amountPaid,
    amountRefunded,
    outstanding,
    securityDeposit,
    refundableDeposit,
    paymentState,
  };
}

function checkoutFor(booking, extras, groupedMembers) {
  const membership = extras.members.find((row) => row.id === booking.id);
  if (!membership) return undefined;
  const members = groupedMembers.filter((member) =>
    extras.members.some((row) => row.id === member.id && row.order_id === membership.order_id),
  );
  return summarizeCheckout(membership.order_id, members);
}

export async function bookingView(database, booking, options) {
  const graph = await findBookingGraph(
    database,
    typeof booking === 'string' ? booking : booking.id,
  );
  if (!graph) fail(404, 'Booking not found.');
  const extras = await checkoutExtras(database);
  const group = extras.members.find((row) => row.id === graph.id);
  const groupGraphs = group
    ? await Promise.all(
        extras.members
          .filter((row) => row.order_id === group.order_id)
          .map(async (row) => (row.id === graph.id ? graph : findBookingGraph(database, row.id))),
      )
    : [graph];
  const groupedMembers = groupGraphs
    .filter(Boolean)
    .map((item) => presentBooking(withAddOns(item, extras)));
  const checkout = checkoutFor({ id: graph.id }, extras, groupedMembers);
  const currentGraph = withAddOns(graph, extras);
  return presentBooking(checkout ? { ...currentGraph, checkout } : currentGraph, options);
}

export async function listBookingViews(database) {
  const extras = await checkoutExtras(database);
  const graphs = await listBookingGraphs(database);
  const members = graphs.map((graph) => presentBooking(withAddOns(graph, extras)));
  return graphs.map((graph, index) => {
    const checkout = checkoutFor(members[index], extras, members);
    const currentGraph = withAddOns(graph, extras);
    return presentBooking(checkout ? { ...currentGraph, checkout } : currentGraph);
  });
}
