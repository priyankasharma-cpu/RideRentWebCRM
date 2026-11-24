import { collection, mongoOptions } from '../../config/mongoDatabase.js';

export async function cancellationFeeBalance(db, bookingId) {
  const [row] = await collection(db, 'finance_adjustments')
    .aggregate(
      [
        { $match: { bookingId, kind: 'cancellation_fee' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ],
      mongoOptions(db),
    )
    .toArray();
  return row?.total || 0;
}
