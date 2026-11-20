import { fail } from '../../utils/ApiError.js';

export function canAccess(request, booking) {
  if (request.user) return true;
  const access = request.customerAccess;
  if (
    !access ||
    access.customer_id !== booking.customer_id ||
    !access.booking_ids.includes(booking.id)
  )
    fail(403, 'Verify the email used for this booking to view its details.');
}
