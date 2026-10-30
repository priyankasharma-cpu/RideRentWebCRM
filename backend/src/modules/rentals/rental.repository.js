import { findRecord } from '../../config/database.js';
import { run } from '../../config/database.js';
export async function findBookingByIdVariant2(db, id) {
  return await findRecord(db, 'booking', 'id', id);
}
export async function findVehicleByIdVariant3(db, vehicle_id) {
  return await findRecord(db, 'vehicle', 'id', vehicle_id);
}
export async function insertRental(
  db,
  key,
  bookingId,
  nowValue,
  value4,
  id,
  value6,
  odometer,
  value8,
  value9,
  value10,
) {
  return await run(
    db,
    'INSERT INTO rentals VALUES(?,?,?,?,?,?,?,?,?,?)',
    key,
    bookingId,
    nowValue,
    value4,
    id,
    value6,
    odometer,
    value8,
    value9,
    value10,
  );
}
export async function insertInspection(
  db,
  idValue,
  key,
  value3,
  fuel,
  condition,
  notes,
  id,
  nowValue,
) {
  return await run(
    db,
    'INSERT INTO inspections VALUES(?,?,?,?,?,?,?,?)',
    idValue,
    key,
    value3,
    fuel,
    condition,
    notes,
    id,
    nowValue,
  );
}
export async function updateBookingByIdVariant2(db, bookingId) {
  return await run(db, "UPDATE bookings SET status='active' WHERE id=?", bookingId);
}
export async function updateVehicleByOdometerAndId(db, odometer, vehicleId) {
  return await run(db, 'UPDATE vehicles SET odometer=? WHERE id=?', odometer, vehicleId);
}
export async function findRentalByBookingId(db, bookingId) {
  return await findRecord(db, 'rental', 'bookingId', bookingId);
}
export async function updateRentalByReturnAtAndReturnStaffAndReturnOdometer(
  db,
  nowValue,
  id,
  odometer,
  late,
  lateCharge,
  rentalId,
) {
  return await run(
    db,
    'UPDATE rentals SET return_at=?,return_staff=?,return_odometer=?,late_minutes=?,late_charge=? WHERE id=?',
    nowValue,
    id,
    odometer,
    late,
    lateCharge,
    rentalId,
  );
}
export async function updateBookingByExtraAndId(db, value1, bookingId) {
  return await run(
    db,
    "UPDATE bookings SET status='inspecting',extra=? WHERE id=?",
    value1,
    bookingId,
  );
}
export async function updateBookingByIdVariant3(db, bookingId) {
  return await run(db, "UPDATE bookings SET status='completed' WHERE id=?", bookingId);
}
export async function updateVehicleById(db, vehicle_id) {
  return await run(db, "UPDATE vehicles SET status='Maintenance' WHERE id=?", vehicle_id);
}
