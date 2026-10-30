import { findBookingGraph, listBookingGraphs } from './bookingGraph.repository.js';
import { presentBooking } from './booking.presenter.js';
import { fail } from '../../utils/ApiError.js';

export async function bookingView(database, booking, options) {
  const graph = await findBookingGraph(
    database,
    typeof booking === 'string' ? booking : booking.id,
  );
  if (!graph) fail(404, 'Booking not found.');
  return presentBooking(graph, options);
}

export async function listBookingViews(database) {
  return (await listBookingGraphs(database)).map((graph) => presentBooking(graph));
}
