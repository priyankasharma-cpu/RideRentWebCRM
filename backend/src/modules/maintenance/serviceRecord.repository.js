import { run } from '../../config/database.js';
export async function insertMaintenanceVariant2(
  db,
  idValue,
  vehicleId,
  nowValue,
  value4,
  reason,
  value6,
  nowValueValue,
) {
  return await run(
    db,
    'INSERT INTO maintenance VALUES(?,?,?,?,?,?,?)',
    idValue,
    vehicleId,
    nowValue,
    value4,
    reason,
    value6,
    nowValueValue,
  );
}
