import { hash } from '../../utils/crypto.js';
import { fail } from '../../utils/ApiError.js';
export function canAccess(request, b) {
  if (request.user) return true;
  const token = request.bookingToken;
  if (typeof token !== 'string' || hash(token) !== b.access_hash)
    fail(403, 'Use your booking reference and phone number to access this booking.');
}
