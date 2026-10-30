import { windowSchema } from './availability.validation.js';
import { settings } from '../settings/settings.service.js';
import { fail } from '../../utils/ApiError.js';
export async function rentalWindow(db, input, { future = true } = {}) {
  const { startsAt, endsAt } = windowSchema.parse(input);
  const start = new Date(startsAt),
    end = new Date(endsAt),
    s = await settings(db);
  if (end <= start) fail(400, 'Return time must be after pickup.');
  if (future && start.getTime() < Date.now() - 60000)
    fail(400, 'Choose a pickup time in the future.');
  if (end - start > s.maxRentalDays * 86400000)
    fail(400, `Maximum rental duration is ${s.maxRentalDays} days.`);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    hours: (Math.ceil((end - start) / (s.roundingMinutes * 60000)) * s.roundingMinutes) / 60,
  };
}
