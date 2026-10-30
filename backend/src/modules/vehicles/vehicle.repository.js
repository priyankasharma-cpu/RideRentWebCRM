import { findRecord } from '../../config/database.js';
import { all, get, run } from '../../config/database.js';
export async function listVehicleRecords(db, value1) {
  return await all(db, 'SELECT * FROM vehicles WHERE status<>? ORDER BY name', value1);
}
export async function findVehicleBySlugAndId(db, slug, slugValue) {
  return await get(
    db,
    "SELECT * FROM vehicles WHERE (slug=? OR id=?) AND status<>'Inactive'",
    slug,
    slugValue,
  );
}
export async function listVehicleRecordsVariant2(db) {
  return await all(db, 'SELECT * FROM vehicles ORDER BY name');
}
export async function insertVehicle(
  db,
  key,
  slug,
  name,
  brand,
  category,
  registration,
  rate,
  deposit,
  fuel,
  transmission,
  seats,
  engine,
  image,
  description,
  odometer,
  status,
  nowValue,
) {
  return await run(
    db,
    'INSERT INTO vehicles VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    key,
    slug,
    name,
    brand,
    category,
    registration,
    rate,
    deposit,
    fuel,
    transmission,
    seats,
    engine,
    image,
    description,
    odometer,
    status,
    nowValue,
  );
}
export async function findVehicleById(db, key) {
  return await findRecord(db, 'vehicle', 'id', key);
}
export async function findMaintenanceByVehicleId(db, existingId) {
  return await get(db, 'SELECT id FROM maintenance WHERE vehicle_id=? AND resolved=0', existingId);
}
export async function findBookingByVehicleId(db, existingId) {
  return await get(
    db,
    "SELECT id FROM bookings WHERE vehicle_id=? AND status IN ('confirmed','active','inspecting')",
    existingId,
  );
}
export async function updateVehicleByNameAndBrandAndCategory(
  db,
  name,
  brand,
  category,
  registration,
  rate,
  deposit,
  fuel,
  transmission,
  seats,
  engine,
  image,
  description,
  odometer,
  status,
  existingId,
) {
  return await run(
    db,
    'UPDATE vehicles SET name=?,brand=?,category=?,registration=?,rate=?,deposit=?,fuel=?,transmission=?,seats=?,engine=?,image=?,description=?,odometer=?,status=? WHERE id=?',
    name,
    brand,
    category,
    registration,
    rate,
    deposit,
    fuel,
    transmission,
    seats,
    engine,
    image,
    description,
    odometer,
    status,
    existingId,
  );
}
export async function findBookingByVehicleIdVariant5(db, vehicleId) {
  return await get(
    db,
    "SELECT * FROM bookings WHERE vehicle_id=? AND status IN ('active','inspecting') LIMIT 1",
    vehicleId,
  );
}
export async function findBookingByVehicleIdVariant6(db, vehicleId, current, currentValue) {
  return await get(
    db,
    "SELECT id FROM bookings WHERE vehicle_id=? AND status='confirmed' AND starts_at<=? AND ends_at>?",
    vehicleId,
    current,
    currentValue,
  );
}
export async function findMaintenanceByVehicleIdVariant5(db, vehicleId, current) {
  return await get(
    db,
    'SELECT id FROM maintenance WHERE vehicle_id=? AND resolved=0 AND starts_at<=?',
    vehicleId,
    current,
  );
}
export async function findBookingByVehicleIdVariant7(db, vehicleId) {
  return await get(
    db,
    "SELECT COUNT(*) n FROM bookings WHERE vehicle_id=? AND status<>'cancelled'",
    vehicleId,
  );
}
