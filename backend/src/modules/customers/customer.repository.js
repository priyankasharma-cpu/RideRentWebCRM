import {
  collection,
  fromDocument,
  fromDocuments,
  mongoOptions,
} from '../../config/mongoDatabase.js';

export async function listCustomerRecords(db) {
  const customers = await collection(db, 'customers')
    .find({}, mongoOptions(db))
    .sort({ created_at: -1 })
    .toArray();
  return fromDocuments(customers);
}

export async function listBookingRecordsByCustomerId(db, customerId) {
  const bookings = await collection(db, 'bookings')
    .find({ customer_id: customerId }, mongoOptions(db))
    .toArray();
  return fromDocuments(bookings);
}

export async function findCustomerById(db, id) {
  return fromDocument(
    await collection(db, 'customers').findOne(
      { id },
      { ...mongoOptions(db), projection: { _id: 0, id: 1 } },
    ),
  );
}

export async function updateCustomerByVerifiedAndId(db, verified, id) {
  return collection(db, 'customers').updateOne({ id }, { $set: { verified } }, mongoOptions(db));
}

export async function updateBookingContactByVerifiedAndCustomerId(db, verified, customerId) {
  const bookings = await collection(db, 'bookings')
    .find(
      { customer_id: customerId, status: 'confirmed' },
      { ...mongoOptions(db), projection: { id: 1 } },
    )
    .toArray();
  const bookingIds = bookings.map((booking) => booking.id);
  if (!bookingIds.length) return { matchedCount: 0, modifiedCount: 0 };
  return collection(db, 'booking_contacts').updateMany(
    { booking_id: { $in: bookingIds } },
    { $set: { verified } },
    mongoOptions(db),
  );
}
