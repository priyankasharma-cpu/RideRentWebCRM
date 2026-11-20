import { collection, fromDocuments, mongoOptions } from '../../config/mongoDatabase.js';

export async function listBookingRecordsVariant2(db) {
  return fromDocuments(await collection(db, 'bookings').find({}, mongoOptions(db)).toArray());
}

export async function listVehicleRecordsVariant3(db) {
  return fromDocuments(await collection(db, 'vehicles').find({}, mongoOptions(db)).toArray());
}

export async function listRefundRecords(db) {
  const payments = await collection(db, 'payments')
    .aggregate(
      [
        { $match: { purpose: 'rental' } },
        {
          $lookup: {
            from: 'refunds',
            localField: 'id',
            foreignField: 'payment_id',
            as: 'refunds',
          },
        },
        {
          $addFields: {
            refunded: { $sum: '$refunds.amount' },
          },
        },
        { $project: { _id: 0, refunds: 0 } },
      ],
      mongoOptions(db),
    )
    .toArray();
  return fromDocuments(payments).map((payment) => ({
    ...payment,
    refunded: payment.refunded || 0,
  }));
}

export async function listRentalRecords(db) {
  const rentals = await collection(db, 'rentals')
    .aggregate(
      [
        {
          $lookup: {
            from: 'bookings',
            localField: 'booking_id',
            foreignField: 'id',
            as: 'booking',
          },
        },
        { $unwind: '$booking' },
        { $addFields: { vehicle_id: '$booking.vehicle_id' } },
        { $project: { _id: 0, booking: 0 } },
      ],
      mongoOptions(db),
    )
    .toArray();
  return fromDocuments(rentals);
}
