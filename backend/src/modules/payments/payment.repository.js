import {
  collection,
  fromDocument,
  fromDocuments,
  mongoOptions,
} from '../../config/mongoDatabase.js';

export async function insertPayment(
  db,
  id,
  bookingId,
  amount,
  purpose,
  method,
  note,
  staffId,
  createdAt,
) {
  return collection(db, 'payments').insertOne(
    {
      _id: id,
      id,
      booking_id: bookingId,
      amount,
      purpose,
      method,
      note,
      staff_id: staffId,
      created_at: createdAt,
    },
    mongoOptions(db),
  );
}

export async function findPaymentById(db, id) {
  return fromDocument(await collection(db, 'payments').findOne({ id }, mongoOptions(db)));
}

export async function insertRefund(db, id, paymentId, amount, reason, staffId, createdAt) {
  return collection(db, 'refunds').insertOne(
    {
      _id: id,
      id,
      payment_id: paymentId,
      amount,
      reason,
      staff_id: staffId,
      created_at: createdAt,
    },
    mongoOptions(db),
  );
}

export async function listRefundRecordsVariant2(db) {
  const payments = await collection(db, 'payments')
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
        {
          $lookup: {
            from: 'customers',
            localField: 'booking.customer_id',
            foreignField: 'id',
            as: 'customer',
          },
        },
        { $unwind: '$customer' },
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
            reference: '$booking.reference',
            customer_name: '$customer.name',
            refunded: { $sum: '$refunds.amount' },
          },
        },
        { $project: { _id: 0, booking: 0, customer: 0, refunds: 0 } },
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

export async function listRefundRecordsVariant3(db) {
  const refunds = await collection(db, 'refunds')
    .find({}, mongoOptions(db))
    .sort({ created_at: -1 })
    .toArray();
  return fromDocuments(refunds);
}
