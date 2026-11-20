import { collection, fromDocument, mongoOptions } from '../../config/mongoDatabase.js';

export async function findBookingByIdVariant2(db, id) {
  return fromDocument(await collection(db, 'bookings').findOne({ id }, mongoOptions(db)));
}

export async function findVehicleByIdVariant3(db, id) {
  return fromDocument(await collection(db, 'vehicles').findOne({ id }, mongoOptions(db)));
}

export async function insertRental(
  db,
  id,
  bookingId,
  pickupAt,
  returnAt,
  pickupStaff,
  returnStaff,
  pickupOdometer,
  returnOdometer,
  lateMinutes,
  lateCharge,
) {
  return collection(db, 'rentals').insertOne(
    {
      _id: id,
      id,
      booking_id: bookingId,
      pickup_at: pickupAt,
      return_at: returnAt,
      pickup_staff: pickupStaff,
      return_staff: returnStaff,
      pickup_odometer: pickupOdometer,
      return_odometer: returnOdometer,
      late_minutes: lateMinutes,
      late_charge: lateCharge,
    },
    mongoOptions(db),
  );
}

export async function insertInspection(
  db,
  id,
  rentalId,
  type,
  fuel,
  condition,
  notes,
  staffId,
  createdAt,
) {
  return collection(db, 'inspections').insertOne(
    {
      _id: id,
      id,
      rental_id: rentalId,
      type,
      fuel,
      condition,
      notes,
      staff_id: staffId,
      created_at: createdAt,
    },
    mongoOptions(db),
  );
}

export async function updateBookingByIdVariant2(db, bookingId) {
  return collection(db, 'bookings').updateOne(
    { id: bookingId },
    { $set: { status: 'active' } },
    mongoOptions(db),
  );
}

export async function updateVehicleByOdometerAndId(db, odometer, vehicleId) {
  return collection(db, 'vehicles').updateOne(
    { id: vehicleId },
    { $set: { odometer } },
    mongoOptions(db),
  );
}

export async function findRentalByBookingId(db, bookingId) {
  return fromDocument(
    await collection(db, 'rentals').findOne({ booking_id: bookingId }, mongoOptions(db)),
  );
}

export async function updateRentalByReturnAtAndReturnStaffAndReturnOdometer(
  db,
  returnAt,
  returnStaff,
  returnOdometer,
  lateMinutes,
  lateCharge,
  rentalId,
) {
  return collection(db, 'rentals').updateOne(
    { id: rentalId },
    {
      $set: {
        return_at: returnAt,
        return_staff: returnStaff,
        return_odometer: returnOdometer,
        late_minutes: lateMinutes,
        late_charge: lateCharge,
      },
    },
    mongoOptions(db),
  );
}

export async function updateBookingByExtraAndId(db, extra, bookingId) {
  return collection(db, 'bookings').updateOne(
    { id: bookingId },
    { $set: { status: 'inspecting', extra } },
    mongoOptions(db),
  );
}

export async function updateBookingByIdVariant3(db, bookingId) {
  return collection(db, 'bookings').updateOne(
    { id: bookingId },
    { $set: { status: 'completed' } },
    mongoOptions(db),
  );
}

export async function updateVehicleById(db, vehicleId) {
  return collection(db, 'vehicles').updateOne(
    { id: vehicleId },
    { $set: { status: 'Maintenance' } },
    mongoOptions(db),
  );
}
