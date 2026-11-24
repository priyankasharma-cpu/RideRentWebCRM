import {
  collection,
  fromDocument,
  fromDocuments,
  mongoOptions,
} from '../../config/mongoDatabase.js';

export async function findVehicleByIdVariant2(db, id) {
  return fromDocument(await collection(db, 'vehicles').findOne({ id }, mongoOptions(db)));
}

export async function findBookingById(db, id) {
  return fromDocument(await collection(db, 'bookings').findOne({ id }, mongoOptions(db)));
}

export async function updateBookingById(db, bookingId) {
  return collection(db, 'bookings').updateOne(
    { id: bookingId },
    { $set: { status: 'cancelled' } },
    mongoOptions(db),
  );
}

export async function listBookingRecords(db) {
  const bookings = await collection(db, 'bookings')
    .find({}, mongoOptions(db))
    .sort({ created_at: -1 })
    .toArray();
  return fromDocuments(bookings);
}

export async function findCustomerByPhone(db, phone) {
  return fromDocument(await collection(db, 'customers').findOne({ phone }, mongoOptions(db)));
}

export async function insertCustomer(db, id, name, phone, email, verified, createdAt) {
  return collection(db, 'customers').insertOne(
    { _id: id, id, name, phone, email, verified, created_at: createdAt },
    mongoOptions(db),
  );
}

export async function updateCustomerByNameAndEmailAndVerified(db, name, email, verified, id) {
  return collection(db, 'customers').updateOne(
    { id },
    { $set: { name, email, verified } },
    mongoOptions(db),
  );
}

export async function insertBooking(
  db,
  bookingId,
  reference,
  accessHash,
  customerId,
  vehicleId,
  start,
  end,
  hours,
  rate,
  base,
  tax,
  deposit,
  extra,
  status,
  source,
  notes,
  createdAt,
  financeSource,
) {
  return collection(db, 'bookings').insertOne(
    {
      _id: bookingId,
      id: bookingId,
      reference,
      access_hash: accessHash,
      customer_id: customerId,
      vehicle_id: vehicleId,
      starts_at: start,
      ends_at: end,
      hours,
      rate,
      base,
      tax,
      deposit,
      extra,
      status,
      source,
      finance_source: financeSource,
      notes,
      created_at: createdAt,
    },
    mongoOptions(db),
  );
}

export async function insertBookingContact(db, bookingId, name, phone, email, verified) {
  return collection(db, 'booking_contacts').insertOne(
    { _id: bookingId, booking_id: bookingId, name, phone, email, verified },
    mongoOptions(db),
  );
}

export async function updateBookingByStartsAtAndEndsAtAndHours(
  db,
  start,
  end,
  hours,
  base,
  tax,
  bookingId,
) {
  return collection(db, 'bookings').updateOne(
    { id: bookingId },
    { $set: { starts_at: start, ends_at: end, hours, base, tax } },
    mongoOptions(db),
  );
}

export async function findCustomerByIdVariant2(db, id) {
  return fromDocument(await collection(db, 'customers').findOne({ id }, mongoOptions(db)));
}

export async function findRentalByBookingIdVariant2(db, bookingId) {
  return fromDocument(
    await collection(db, 'rentals').findOne({ booking_id: bookingId }, mongoOptions(db)),
  );
}

export async function listRefundRecordsByBookingId(db, bookingId) {
  const payments = await collection(db, 'payments')
    .aggregate(
      [
        { $match: { booking_id: bookingId } },
        {
          $lookup: {
            from: 'refunds',
            localField: 'id',
            foreignField: 'payment_id',
            as: 'refunds',
          },
        },
        { $addFields: { refunded: { $sum: '$refunds.amount' } } },
        { $project: { _id: 0, refunds: 0 } },
        { $sort: { created_at: -1 } },
      ],
      mongoOptions(db),
    )
    .toArray();
  return fromDocuments(payments).map((payment) => ({
    ...payment,
    refunded: payment.refunded || 0,
  }));
}

export async function findBookingContactByBookingId(db, bookingId) {
  return fromDocument(
    await collection(db, 'booking_contacts').findOne(
      { booking_id: bookingId },
      { ...mongoOptions(db), projection: { _id: 0, name: 1, phone: 1, email: 1, verified: 1 } },
    ),
  );
}

export async function listInspectionRecordsByRentalId(db, rentalId) {
  const inspections = await collection(db, 'inspections')
    .find({ rental_id: rentalId }, mongoOptions(db))
    .sort({ created_at: 1 })
    .toArray();
  return fromDocuments(inspections);
}
