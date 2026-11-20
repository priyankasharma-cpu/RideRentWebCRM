import {
  collection,
  fromDocument,
  fromDocuments,
  mongoOptions,
} from '../../config/mongoDatabase.js';

export async function listMaintenanceRecords(db) {
  const records = await collection(db, 'maintenance')
    .aggregate(
      [
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicle_id',
            foreignField: 'id',
            as: 'vehicle',
          },
        },
        { $unwind: '$vehicle' },
        { $addFields: { vehicle_name: '$vehicle.name' } },
        { $project: { _id: 0, vehicle: 0 } },
        { $sort: { created_at: -1 } },
      ],
      mongoOptions(db),
    )
    .toArray();
  return fromDocuments(records);
}

export async function findVehicleByIdVariant4(db, id) {
  return fromDocument(
    await collection(db, 'vehicles').findOne(
      { id },
      { ...mongoOptions(db), projection: { _id: 0, id: 1 } },
    ),
  );
}

export async function findBookingByVehicleIdVariant2(db, vehicleId, end, start) {
  return fromDocument(
    await collection(db, 'bookings').findOne(
      {
        vehicle_id: vehicleId,
        $or: [
          { status: { $in: ['active', 'inspecting'] } },
          { status: 'confirmed', starts_at: { $lt: end }, ends_at: { $gt: start } },
        ],
      },
      { ...mongoOptions(db), projection: { _id: 0, id: 1 } },
    ),
  );
}

export async function insertMaintenance(
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

export async function findMaintenanceById(db, id) {
  return fromDocument(await collection(db, 'maintenance').findOne({ id }, mongoOptions(db)));
}

export async function updateMaintenanceById(db, id) {
  return collection(db, 'maintenance').updateOne(
    { id },
    { $set: { resolved: 1 } },
    mongoOptions(db),
  );
}

export async function findMaintenanceByVehicleIdVariant2(db, vehicleId) {
  return fromDocument(
    await collection(db, 'maintenance').findOne(
      { vehicle_id: vehicleId, resolved: 0 },
      { ...mongoOptions(db), projection: { _id: 0, id: 1 } },
    ),
  );
}

export async function updateVehicleByIdVariant2(db, vehicleId) {
  return collection(db, 'vehicles').updateOne(
    { id: vehicleId, status: 'Maintenance' },
    { $set: { status: 'Available' } },
    mongoOptions(db),
  );
}
