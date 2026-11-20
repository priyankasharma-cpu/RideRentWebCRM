import {
  findAvailabilityVehicle,
  listVehicleReservations,
  listVehicleServiceBlocks,
} from './availability.repository.js';
import { assessAvailability } from './availability.rules.js';
import { queryGroup } from '../../config/mongoDatabase.js';

export async function availability(database, vehicleId, start, end, excludedBookingId = '') {
  const vehicle = await findAvailabilityVehicle(database, vehicleId);
  if (!vehicle) return { available: false, reason: 'Vehicle not found' };
  const [reservations, maintenance] = await queryGroup(database, [
    () => listVehicleReservations(database, vehicleId, excludedBookingId),
    () => listVehicleServiceBlocks(database, vehicleId),
  ]);
  return assessAvailability(vehicle, reservations, maintenance, start, end);
}
