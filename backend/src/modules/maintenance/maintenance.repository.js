import { findRecord } from '../../config/database.js';
import { all, get, run } from '../../config/database.js';
export async function listMaintenanceRecords(db) {
  return await all(
    db,
    'SELECT m.*,v.name vehicle_name FROM maintenance m JOIN vehicles v ON v.id=m.vehicle_id ORDER BY m.created_at DESC',
  );
}
export async function findVehicleByIdVariant4(db, vehicleId) {
  return await get(db, 'SELECT id FROM vehicles WHERE id=?', vehicleId);
}
export async function findBookingByVehicleIdVariant2(db, vehicleId, end, start) {
  return await get(
    db,
    "SELECT id FROM bookings WHERE vehicle_id=? AND (status IN ('active','inspecting') OR status='confirmed' AND starts_at<? AND ends_at>?)",
    vehicleId,
    end,
    start,
  );
}
export async function insertMaintenance(db, key, vehicleId, start, end, reason, value6, nowValue) {
  return await run(
    db,
    'INSERT INTO maintenance VALUES(?,?,?,?,?,?,?)',
    key,
    vehicleId,
    start,
    end,
    reason,
    value6,
    nowValue,
  );
}
export async function findMaintenanceById(db, id) {
  return await findRecord(db, 'maintenanceBlock', 'id', id);
}
export async function updateMaintenanceById(db, maintenanceId) {
  return await run(db, 'UPDATE maintenance SET resolved=1 WHERE id=?', maintenanceId);
}
export async function findMaintenanceByVehicleIdVariant2(db, vehicle_id) {
  return await get(db, 'SELECT id FROM maintenance WHERE vehicle_id=? AND resolved=0', vehicle_id);
}
export async function updateVehicleByIdVariant2(db, vehicle_id) {
  return await run(
    db,
    "UPDATE vehicles SET status='Available' WHERE id=? AND status='Maintenance'",
    vehicle_id,
  );
}
