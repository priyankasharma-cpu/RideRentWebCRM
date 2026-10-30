import { all } from '../../config/database.js';

export const listCurrentReservations = (database) =>
  all(database, "SELECT * FROM bookings WHERE status IN ('confirmed','active','inspecting')");
export const listUnresolvedMaintenance = (database) =>
  all(database, 'SELECT * FROM maintenance WHERE resolved=0');
export const countVehicleReservations = (database) =>
  all(
    database,
    "SELECT vehicle_id,COUNT(*) count FROM bookings WHERE status<>'cancelled' GROUP BY vehicle_id",
  );
