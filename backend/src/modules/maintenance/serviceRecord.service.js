import { insertMaintenanceVariant2 } from './serviceRecord.repository.js';
import { id } from '../../utils/crypto.js';
import { now } from '../../utils/dateTime.js';
export async function serviceRecord(db, vehicleId, reason) {
  return await insertMaintenanceVariant2(
    db,
    id(),
    vehicleId,
    now(),
    new Date(Date.now() + 86400000).toISOString(),
    reason,
    0,
    now(),
  );
}
