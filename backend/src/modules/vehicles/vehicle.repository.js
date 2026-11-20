import {
  collection,
  fromDocument,
  fromDocuments,
  mongoOptions,
} from '../../config/mongoDatabase.js';

export async function listVehicleRecords(db, excludedStatus) {
  const vehicles = await collection(db, 'vehicles')
    .find({ status: { $ne: excludedStatus } }, mongoOptions(db))
    .sort({ name: 1 })
    .toArray();
  return fromDocuments(vehicles);
}

export async function findVehicleBySlugAndId(db, slug, id) {
  return fromDocument(
    await collection(db, 'vehicles').findOne(
      { $or: [{ slug }, { id }], status: { $ne: 'Inactive' } },
      mongoOptions(db),
    ),
  );
}

export async function listVehicleRecordsVariant2(db) {
  const vehicles = await collection(db, 'vehicles')
    .find({}, mongoOptions(db))
    .sort({ name: 1 })
    .toArray();
  return fromDocuments(vehicles);
}

export async function insertVehicle(
  db,
  id,
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
  createdAt,
) {
  return collection(db, 'vehicles').insertOne(
    {
      _id: id,
      id,
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
      created_at: createdAt,
    },
    mongoOptions(db),
  );
}

export async function findVehicleById(db, id) {
  return fromDocument(await collection(db, 'vehicles').findOne({ id }, mongoOptions(db)));
}

export async function findMaintenanceByVehicleId(db, vehicleId) {
  return fromDocument(
    await collection(db, 'maintenance').findOne(
      { vehicle_id: vehicleId, resolved: 0 },
      { ...mongoOptions(db), projection: { _id: 0, id: 1 } },
    ),
  );
}

export async function findBookingByVehicleId(db, vehicleId) {
  return fromDocument(
    await collection(db, 'bookings').findOne(
      { vehicle_id: vehicleId, status: { $in: ['confirmed', 'active', 'inspecting'] } },
      { ...mongoOptions(db), projection: { _id: 0, id: 1 } },
    ),
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
  id,
) {
  return collection(db, 'vehicles').updateOne(
    { id },
    {
      $set: {
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
      },
    },
    mongoOptions(db),
  );
}

export async function findBookingByVehicleIdVariant5(db, vehicleId) {
  return fromDocument(
    await collection(db, 'bookings').findOne(
      { vehicle_id: vehicleId, status: { $in: ['active', 'inspecting'] } },
      mongoOptions(db),
    ),
  );
}

export async function findBookingByVehicleIdVariant6(db, vehicleId, current, currentValue) {
  return fromDocument(
    await collection(db, 'bookings').findOne(
      {
        vehicle_id: vehicleId,
        status: 'confirmed',
        starts_at: { $lte: current },
        ends_at: { $gt: currentValue },
      },
      { ...mongoOptions(db), projection: { _id: 0, id: 1 } },
    ),
  );
}

export async function findMaintenanceByVehicleIdVariant5(db, vehicleId, current) {
  return fromDocument(
    await collection(db, 'maintenance').findOne(
      { vehicle_id: vehicleId, resolved: 0, starts_at: { $lte: current } },
      { ...mongoOptions(db), projection: { _id: 0, id: 1 } },
    ),
  );
}

export async function findBookingByVehicleIdVariant7(db, vehicleId) {
  return {
    n: await collection(db, 'bookings').countDocuments(
      { vehicle_id: vehicleId, status: { $ne: 'cancelled' } },
      mongoOptions(db),
    ),
  };
}
