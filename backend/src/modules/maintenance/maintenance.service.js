import {
  listMaintenanceRecords,
  findVehicleByIdVariant4,
  findBookingByVehicleIdVariant2,
  insertMaintenance,
  findMaintenanceById,
  updateMaintenanceById,
  findMaintenanceByVehicleIdVariant2,
  updateVehicleByIdVariant2,
} from './maintenance.repository.js';
import { transaction } from '../../config/database.js';
import { rentalWindow } from '../availability/rentalWindow.service.js';
import { availability } from '../availability/availability.service.js';
import { fail } from '../../utils/ApiError.js';
import { id } from '../../utils/crypto.js';
import { now } from '../../utils/dateTime.js';
import { audit } from '../audit/audit.service.js';
export async function listMaintenance(db, _request) {
  return await listMaintenanceRecords(db);
}
export async function scheduleMaintenance(db, request) {
  const input = request.body;
  await transaction(db, async () => {
    const w = await rentalWindow(db, input, {
        future: false,
      }),
      a = await availability(db, input.vehicleId, w.start, w.end);
    if (!(await findVehicleByIdVariant4(db, input.vehicleId))) fail(404, 'Vehicle not found.');
    if (await findBookingByVehicleIdVariant2(db, input.vehicleId, w.end, w.start))
      fail(409, 'This maintenance window conflicts with an open rental or reservation.');
    if (
      !a.available &&
      a.reason !== 'Vehicle is under maintenance' &&
      !a.reason.startsWith('Vehicle has a maintenance')
    )
      fail(409, a.reason);
    const key = id();
    await insertMaintenance(db, key, input.vehicleId, w.start, w.end, input.reason, 0, now());
    await audit(db, request.user.id, 'maintenance.created', key);
  });
  return {
    ok: true,
  };
}
export async function resolveMaintenance(db, request) {
  await transaction(db, async () => {
    const m = await findMaintenanceById(db, request.params.id);
    if (!m) fail(404, 'Maintenance record not found.');
    await updateMaintenanceById(db, m.id);
    if (!(await findMaintenanceByVehicleIdVariant2(db, m.vehicle_id)))
      await updateVehicleByIdVariant2(db, m.vehicle_id);
    await audit(db, request.user.id, 'maintenance.resolved', m.id);
  });
  return {
    ok: true,
  };
}
