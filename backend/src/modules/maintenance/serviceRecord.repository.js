import { collection, mongoOptions } from '../../config/mongoDatabase.js';

export async function insertMaintenanceVariant2(
  db,
  id,
  vehicleId,
  start,
  end,
  reason,
  resolved,
  createdAt,
) {
  return collection(db, 'maintenance').insertOne(
    {
      _id: id,
      id,
      vehicle_id: vehicleId,
      starts_at: start,
      ends_at: end,
      reason,
      resolved,
      created_at: createdAt,
    },
    mongoOptions(db),
  );
}
