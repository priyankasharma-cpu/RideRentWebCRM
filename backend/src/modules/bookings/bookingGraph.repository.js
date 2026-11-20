import {
  collection,
  fromDocument,
  fromDocuments,
  mongoOptions,
  queryGroup,
} from '../../config/mongoDatabase.js';

async function hydrateBooking(database, booking) {
  const [vehicle, customer, contact, rental, payments] = await queryGroup(database, [
    () =>
      collection(database, 'vehicles').findOne({ id: booking.vehicle_id }, mongoOptions(database)),
    () =>
      collection(database, 'customers').findOne(
        { id: booking.customer_id },
        mongoOptions(database),
      ),
    () =>
      collection(database, 'booking_contacts').findOne(
        { booking_id: booking.id },
        mongoOptions(database),
      ),
    () =>
      collection(database, 'rentals').findOne({ booking_id: booking.id }, mongoOptions(database)),
    () =>
      collection(database, 'payments')
        .find({ booking_id: booking.id }, mongoOptions(database))
        .sort({ created_at: -1 })
        .toArray(),
  ]);

  const rentalRecord = fromDocument(rental);
  const [inspections, paymentRefunds] = await queryGroup(database, [
    () =>
      rentalRecord
        ? collection(database, 'inspections')
            .find({ rental_id: rentalRecord.id }, mongoOptions(database))
            .sort({ created_at: 1 })
            .toArray()
        : [],
    async () => {
      const refunds = [];
      for (const payment of payments) {
        refunds.push(
          await collection(database, 'refunds')
            .find({ payment_id: payment.id }, mongoOptions(database))
            .toArray(),
        );
      }
      return refunds;
    },
  ]);

  return {
    ...booking,
    vehicle: fromDocument(vehicle),
    customer: fromDocument(customer),
    contact: contact
      ? {
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          verified: contact.verified,
        }
      : null,
    rental: rentalRecord ? { ...rentalRecord, inspections: fromDocuments(inspections) } : null,
    payments: payments.map((payment, index) => ({
      ...fromDocument(payment),
      refunds: fromDocuments(paymentRefunds[index]),
    })),
  };
}

export async function findBookingGraph(database, id) {
  const booking = await collection(database, 'bookings').findOne({ id }, mongoOptions(database));
  return booking ? hydrateBooking(database, fromDocument(booking)) : null;
}

export async function listBookingGraphs(database) {
  const bookings = await collection(database, 'bookings')
    .find({}, mongoOptions(database))
    .toArray();
  return queryGroup(
    database,
    fromDocuments(bookings).map((booking) => () => hydrateBooking(database, booking)),
  );
}
