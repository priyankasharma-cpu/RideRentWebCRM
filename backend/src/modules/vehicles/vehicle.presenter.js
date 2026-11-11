import { listVehicleImages } from './vehicleGallery.repository.js';
import { now } from '../../utils/dateTime.js';
import { assessAvailability, physicalVehicleStatus } from '../availability/availability.rules.js';
import {
  listCurrentReservations,
  listUnresolvedMaintenance,
  countVehicleReservations,
} from './vehicleState.repository.js';

export async function vehicleViews(database, vehicles, window) {
  const [reservations, maintenance, counts, images] = await Promise.all([
    listCurrentReservations(database),
    listUnresolvedMaintenance(database),
    countVehicleReservations(database),
    listVehicleImages(database),
  ]);
  const current = now();
  const countByVehicle = new Map(counts.map((row) => [row.vehicle_id, row.count]));
  return vehicles.map((vehicle) => {
    const bookings = reservations.filter((booking) => booking.vehicle_id === vehicle.id);
    const serviceBlocks = maintenance.filter((block) => block.vehicle_id === vehicle.id);
    return {
      ...vehicle,
      images: images
        .filter((image) => image.vehicle_id === vehicle.id)
        .map(({ id, label, url }) => ({ id, label, url })),
      rentalCount: countByVehicle.get(vehicle.id) || 0,
      physicalStatus: physicalVehicleStatus(vehicle, bookings, serviceBlocks, current),
      ...(window
        ? assessAvailability(vehicle, bookings, serviceBlocks, window.start, window.end)
        : {}),
      type: vehicle.category,
      price: vehicle.rate / 100,
      detail: vehicle.engine,
      trans: vehicle.transmission,
    };
  });
}

export async function vehicleView(database, vehicle, window) {
  return (await vehicleViews(database, [vehicle], window))[0];
}
