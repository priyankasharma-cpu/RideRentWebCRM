import { collection, fromDocuments, mongoOptions } from '../../config/mongoDatabase.js';

export async function listCurrentReservations(database) {
  const bookings = await collection(database, 'bookings')
    .find({ status: { $in: ['confirmed', 'active', 'inspecting'] } }, mongoOptions(database))
    .toArray();
  return fromDocuments(bookings);
}

export async function listUnresolvedMaintenance(database) {
  const blocks = await collection(database, 'maintenance')
    .find({ resolved: 0 }, mongoOptions(database))
    .toArray();
  return fromDocuments(blocks);
}

export async function countVehicleReservations(database) {
  return collection(database, 'bookings')
    .aggregate(
      [
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: '$vehicle_id', count: { $sum: 1 } } },
        { $project: { _id: 0, vehicle_id: '$_id', count: 1 } },
      ],
      mongoOptions(database),
    )
    .toArray();
}
