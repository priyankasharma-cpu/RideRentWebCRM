import { transaction } from '../../config/database.js';
import {
  findBookingByIdVariant2,
  findVehicleByIdVariant3,
  insertRental,
  insertInspection,
  updateBookingByIdVariant2,
  updateVehicleByOdometerAndId,
  findRentalByBookingId,
  updateRentalByReturnAtAndReturnStaffAndReturnOdometer,
  updateBookingByExtraAndId,
  updateBookingByIdVariant3,
  updateVehicleById,
} from './rental.repository.js';
import { fail } from '../../utils/ApiError.js';
import { bookingView } from '../bookings/booking.read.service.js';
import { availability } from '../availability/availability.service.js';
import { now } from '../../utils/dateTime.js';
import { id } from '../../utils/crypto.js';
import { audit } from '../audit/audit.service.js';
import { settings } from '../settings/settings.service.js';
import { serviceRecord } from '../maintenance/serviceRecord.service.js';
export async function pickUpRental(db, request) {
  const input = request.body;
  await transaction(db, async () => {
    const b = await findBookingByIdVariant2(db, request.params.id);
    if (!b) fail(404, 'Booking not found.');
    if (b.status !== 'confirmed') fail(409, 'Only confirmed bookings can be picked up.');
    if (new Date(b.starts_at) - Date.now() > 3600000 || new Date(b.ends_at) <= new Date())
      fail(
        409,
        'Pickup opens one hour before the scheduled time. Reschedule expired bookings first.',
      );
    const c = (await bookingView(db, b)).customer;
    if (!c.verified) fail(409, 'Verify the customer’s driving license before pickup.');
    const a = await availability(db, b.vehicle_id, now(), b.ends_at, b.id);
    if (!a.available) fail(409, a.reason);
    const v = await findVehicleByIdVariant3(db, b.vehicle_id);
    if (input.odometer < v.odometer) fail(400, 'Odometer cannot decrease.');
    const key = id();
    await insertRental(
      db,
      key,
      b.id,
      now(),
      null,
      request.user.id,
      null,
      input.odometer,
      null,
      0,
      0,
    );
    await insertInspection(
      db,
      id(),
      key,
      'pickup',
      input.fuel,
      input.condition,
      input.notes,
      request.user.id,
      now(),
    );
    await updateBookingByIdVariant2(db, b.id);
    await updateVehicleByOdometerAndId(db, input.odometer, v.id);
    await audit(db, request.user.id, 'rental.picked_up', b.id, input);
  });
  return await bookingView(db, request.params.id);
}
export async function returnRental(db, request) {
  const input = request.body;
  await transaction(db, async () => {
    const b = await findBookingByIdVariant2(db, request.params.id);
    if (!b) fail(404, 'Booking not found.');
    if (b.status !== 'active') fail(409, 'Only active rentals can be returned.');
    const r = await findRentalByBookingId(db, b.id);
    if (input.odometer < r.pickup_odometer)
      fail(400, 'Return odometer cannot be below pickup reading.');
    const s = await settings(db),
      late = Math.max(0, Math.ceil((Date.now() - new Date(b.ends_at)) / 60000)),
      lateCharge =
        late > s.lateGraceMinutes ? Math.ceil((late - s.lateGraceMinutes) / 60) * b.rate : 0;
    await updateRentalByReturnAtAndReturnStaffAndReturnOdometer(
      db,
      now(),
      request.user.id,
      input.odometer,
      late,
      lateCharge,
      r.id,
    );
    await insertInspection(
      db,
      id(),
      r.id,
      'return',
      input.fuel,
      input.condition,
      input.notes,
      request.user.id,
      now(),
    );
    await updateBookingByExtraAndId(db, lateCharge + input.additional, b.id);
    await updateVehicleByOdometerAndId(db, input.odometer, b.vehicle_id);
    await audit(db, request.user.id, 'rental.returned', b.id, {
      ...input,
      late,
      lateCharge,
    });
  });
  return await bookingView(db, request.params.id);
}
export async function completeRental(db, request) {
  const input = request.body;
  await transaction(db, async () => {
    const b = await findBookingByIdVariant2(db, request.params.id);
    if (!b) fail(404, 'Booking not found.');
    if (b.status !== 'inspecting') fail(409, 'Record a return inspection first.');
    if ((await bookingView(db, b)).outstanding > 0)
      fail(409, 'Settle outstanding rental and deposit charges before closing.');
    await updateBookingByIdVariant3(db, b.id);
    if (!input.roadReady) {
      await updateVehicleById(db, b.vehicle_id);
      await serviceRecord(db, b.vehicle_id, 'Return inspection requires service');
    }
    await audit(db, request.user.id, 'rental.inspection_completed', b.id, input);
  });
  return await bookingView(db, request.params.id);
}
