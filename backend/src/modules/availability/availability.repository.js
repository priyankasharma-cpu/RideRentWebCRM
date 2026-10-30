import { all, findRecord } from '../../config/database.js';

export const findAvailabilityVehicle = (database, id) => findRecord(database, 'vehicle', 'id', id);
export const listVehicleReservations = (database, vehicleId, excludedBookingId) =>
  all(
    database,
    "SELECT * FROM bookings WHERE vehicle_id=? AND id<>? AND status IN ('confirmed','active','inspecting')",
    vehicleId,
    excludedBookingId,
  );
export const listVehicleServiceBlocks = (database, vehicleId) =>
  all(database, 'SELECT * FROM maintenance WHERE vehicle_id=? AND resolved=0', vehicleId);
