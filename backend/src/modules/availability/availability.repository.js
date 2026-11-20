import {
  collection,
  fromDocument,
  fromDocuments,
  mongoOptions,
} from '../../config/mongoDatabase.js';

export const findAvailabilityVehicle = async (database, id) =>
  fromDocument(await collection(database, 'vehicles').findOne({ id }, mongoOptions(database)));

export async function listVehicleReservations(database, vehicleId, excludedBookingId) {
  const records = await collection(database, 'bookings')
    .find(
      {
        vehicle_id: vehicleId,
        id: { $ne: excludedBookingId },
        status: { $in: ['confirmed', 'active', 'inspecting'] },
      },
      mongoOptions(database),
    )
    .toArray();
  return fromDocuments(records);
}

export async function listVehicleServiceBlocks(database, vehicleId) {
  const records = await collection(database, 'maintenance')
    .find({ vehicle_id: vehicleId, resolved: 0 }, mongoOptions(database))
    .toArray();
  return fromDocuments(records);
}
