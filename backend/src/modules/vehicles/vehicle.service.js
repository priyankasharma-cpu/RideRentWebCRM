import { rentalWindow } from '../availability/rentalWindow.service.js';
import {
  listVehicleRecords,
  findVehicleBySlugAndId,
  listVehicleRecordsVariant2,
  insertVehicle,
  findVehicleById,
  findMaintenanceByVehicleId,
  findBookingByVehicleId,
  updateVehicleByNameAndBrandAndCategory,
} from './vehicle.repository.js';
import { vehicleView, vehicleViews } from './vehicle.presenter.js';
import { fail } from '../../utils/ApiError.js';
import { id } from '../../utils/crypto.js';
import { transaction } from '../../config/database.js';
import { now } from '../../utils/dateTime.js';
import { serviceRecord } from '../maintenance/serviceRecord.service.js';
import { audit } from '../audit/audit.service.js';
export async function listPublicVehicles(db, request) {
  let w;
  if (request.query.startsAt || request.query.endsAt) w = await rentalWindow(db, request.query);
  let vehicles = await vehicleViews(db, await listVehicleRecords(db, 'Inactive'), w);
  if (request.query.category)
    vehicles = vehicles.filter((v) => v.category === request.query.category);
  if (request.query.q)
    vehicles = vehicles.filter((v) =>
      v.name.toLowerCase().includes(String(request.query.q).toLowerCase()),
    );
  if (request.query.available === 'true')
    vehicles = vehicles.filter((v) => (w ? v.available : v.physicalStatus === 'Available'));
  return vehicles;
}
export async function getPublicVehicle(db, request) {
  const v = await findVehicleBySlugAndId(db, request.params.slug, request.params.slug);
  if (!v) fail(404, 'Vehicle not found.');
  return await vehicleView(db, v);
}
export async function listManagedVehicles(db, _request) {
  return await vehicleViews(db, await listVehicleRecordsVariant2(db));
}
export async function addVehicle(db, request) {
  const v = request.body,
    key = id(),
    slug = v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + key.slice(0, 5);
  await transaction(db, async () => {
    await insertVehicle(
      db,
      key,
      slug,
      v.name,
      v.brand,
      v.category,
      v.registration,
      v.rate,
      v.deposit,
      v.fuel,
      v.transmission,
      v.seats,
      v.engine,
      v.image,
      v.description,
      v.odometer,
      v.status,
      now(),
    );
    if (v.status === 'Maintenance') await serviceRecord(db, key, 'Vehicle added awaiting service');
    await audit(db, request.user.id, 'vehicle.created', key);
  });
  return await vehicleView(db, await findVehicleById(db, key));
}
export async function editVehicle(db, request) {
  const v = request.body;
  await transaction(db, async () => {
    const old = await findVehicleById(db, request.params.id);
    if (!old) fail(404, 'Vehicle not found.');
    if (
      v.status === 'Available' &&
      old.status === 'Maintenance' &&
      (await findMaintenanceByVehicleId(db, old.id))
    )
      fail(
        409,
        'Complete outstanding service records in Maintenance before releasing this vehicle.',
      );
    if (v.odometer < old.odometer) fail(400, 'Odometer cannot decrease.');
    if (v.status !== old.status && (await findBookingByVehicleId(db, old.id)))
      fail(409, 'Resolve open bookings before changing physical vehicle status.');
    await updateVehicleByNameAndBrandAndCategory(
      db,
      v.name,
      v.brand,
      v.category,
      v.registration,
      v.rate,
      v.deposit,
      v.fuel,
      v.transmission,
      v.seats,
      v.engine,
      v.image,
      v.description,
      v.odometer,
      v.status,
      old.id,
    );
    if (v.status === 'Maintenance' && old.status !== 'Maintenance')
      await serviceRecord(db, old.id, 'Vehicle sent for service by administrator');
    await audit(db, request.user.id, 'vehicle.updated', old.id);
  });
  return await vehicleView(db, await findVehicleById(db, request.params.id));
}
