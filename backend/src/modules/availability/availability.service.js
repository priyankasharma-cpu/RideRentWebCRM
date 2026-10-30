import {
  findAvailabilityVehicle,
  listVehicleReservations,
  listVehicleServiceBlocks,
} from './availability.repository.js';
import { assessAvailability } from './availability.rules.js';

export async function availability(database, vehicleId, start, end, excludedBookingId = '') {
  const vehicle = await findAvailabilityVehicle(database, vehicleId);
  if (!vehicle) return { available: false, reason: 'Vehicle not found' };
  const [reservations, maintenance] = await Promise.all([
    listVehicleReservations(database, vehicleId, excludedBookingId),
    listVehicleServiceBlocks(database, vehicleId),
  ]);
  return assessAvailability(vehicle, reservations, maintenance, start, end);
}
