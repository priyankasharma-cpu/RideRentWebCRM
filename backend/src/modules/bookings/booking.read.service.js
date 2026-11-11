import { findBookingGraph, listBookingGraphs } from './bookingGraph.repository.js';
import { presentBooking } from './booking.presenter.js';
import { fail } from '../../utils/ApiError.js';
import { checkoutExtras } from './checkout.repository.js';

function withCheckout(graph, extras) {
  if (!graph) return graph;
  const addons = extras.addons.filter((row) => row.booking_id === graph.id);
  const membership = extras.members.find((row) => row.id === graph.id);
  const members = membership
    ? extras.members.filter((row) => row.order_id === membership.order_id)
    : [];
  return {
    ...graph,
    addons,
    checkout: membership
      ? {
          id: membership.order_id,
          bookings: members.map((row) => ({
            id: row.id,
            reference: row.reference,
            name: row.name,
            status: row.status,
          })),
          total: members.reduce((sum, row) => {
            const charges = extras.addons.filter((a) => a.booking_id === row.id);
            return (
              sum +
              (row.status === 'cancelled'
                ? 0
                : row.base +
                  row.tax +
                  row.extra +
                  charges.reduce((total, charge) => total + charge.base + charge.tax, 0)) +
              (['cancelled', 'completed'].includes(row.status) ? 0 : row.deposit)
            );
          }, 0),
        }
      : undefined,
  };
}

export async function bookingView(database, booking, options) {
  const graph = await findBookingGraph(
    database,
    typeof booking === 'string' ? booking : booking.id,
  );
  if (!graph) fail(404, 'Booking not found.');
  return presentBooking(withCheckout(graph, await checkoutExtras(database)), options);
}

export async function listBookingViews(database) {
  const extras = await checkoutExtras(database);
  return (await listBookingGraphs(database)).map((graph) =>
    presentBooking(withCheckout(graph, extras)),
  );
}
