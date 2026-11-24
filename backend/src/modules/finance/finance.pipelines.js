// History is classified at read time so the deployment does not rewrite legacy bookings.
export const lookup = (from, localField, foreignField, as) => ({
  $lookup: { from, localField, foreignField, as },
});
const first = (field) => ({ $first: field });
const sum = (...fields) => ({ $add: fields.map((field) => ({ $ifNull: [field, 0] })) });
const single = (field) => ({ $first: '$' + field });
export const settled = { $in: [null, 'completed', 'succeeded', 'paid', 'success'] };
export const dateRange = (from, to) => ({
  $type: 'string',
  ...(from ? { $gte: from } : {}),
  $lt: to,
});
export const sourceStages = [
  {
    $lookup: {
      from: 'checkout_items',
      localField: 'id',
      foreignField: 'booking_id',
      pipeline: [{ $limit: 1 }, { $project: { _id: 0, order_id: 1 } }],
      as: 'checkout',
    },
  },
  {
    $lookup: {
      from: 'audit',
      localField: 'id',
      foreignField: 'entity_id',
      pipeline: [
        { $match: { action: 'booking.created', user_id: { $type: 'null' } } },
        { $limit: 1 },
      ],
      as: 'publicCreation',
    },
  },
  {
    $set: {
      order: { $ifNull: [single('checkout.order_id'), '$id'] },
      source: {
        $switch: {
          branches: [
            {
              case: { $in: ['$finance_source', ['website', 'walk_in', 'unknown']] },
              then: '$finance_source',
            },
            { case: { $in: ['$source', ['Walk-in', 'walk_in']] }, then: 'walk_in' },
            {
              case: {
                $or: [
                  { $gt: [{ $size: '$checkout' }, 0] },
                  {
                    $and: [
                      { $eq: ['$source', 'Website'] },
                      { $gt: [{ $size: '$publicCreation' }, 0] },
                    ],
                  },
                  { $eq: ['$source', 'website'] },
                ],
              },
              then: 'website',
            },
          ],
          default: 'unknown',
        },
      },
    },
  },
];
const vehicleStages = [
  lookup('vehicles', 'vehicle_id', 'id', 'vehicleDoc'),
  {
    $set: {
      category: single('vehicleDoc.category'),
      vehicle: {
        $cond: [
          { $gt: [{ $strLenCP: { $ifNull: [single('vehicleDoc.registration'), ''] } }, 0] },
          { $concat: [single('vehicleDoc.name'), ' · ', single('vehicleDoc.registration')] },
          single('vehicleDoc.name'),
        ],
      },
    },
  },
];
export function dimensionMatch(query, { expenses = false } = {}) {
  return {
    ...(query.source && !expenses ? { source: query.source } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.vehicleId ? { vehicle_id: query.vehicleId } : {}),
  };
}
const dimensions = (query) => [
  ...sourceStages,
  ...vehicleStages,
  { $match: dimensionMatch(query) },
];

function balanceLookup(to) {
  return [
    {
      $lookup: {
        from: 'payments',
        localField: 'id',
        foreignField: 'booking_id',
        pipeline: [
          {
            $match: {
              purpose: 'rental',
              status: settled,
              created_at: { $lt: to },
              amount: { $gt: 0 },
            },
          },
          {
            $lookup: {
              from: 'refunds',
              localField: 'id',
              foreignField: 'payment_id',
              pipeline: [
                { $match: { status: settled, created_at: { $lt: to }, amount: { $gt: 0 } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
              ],
              as: 'refunds',
            },
          },
          {
            $group: {
              _id: null,
              net: { $sum: { $subtract: ['$amount', { $ifNull: [first('$refunds.total'), 0] }] } },
            },
          },
        ],
        as: 'payments',
      },
    },
    {
      $set: {
        outstanding: {
          $max: [0, { $subtract: ['$bill', { $ifNull: [first('$payments.net'), 0] }] }],
        },
      },
    },
  ];
}

function bucket(field, window) {
  return {
    $dateTrunc: {
      date: { $convert: { input: field, to: 'date', onError: null, onNull: null } },
      unit: window.interval,
      timezone: window.timezone,
      startOfWeek: 'monday',
    },
  };
}

function cancellationOrders(query, activeRange) {
  return {
    $unionWith: {
      coll: 'finance_adjustments',
      pipeline: [
        { $match: { kind: 'cancellation_fee', date: activeRange } },
        lookup('bookings', 'bookingId', 'id', 'booking'),
        { $unwind: '$booking' },
        { $match: { 'booking.status': 'cancelled' } },
        {
          $project: {
            _id: 0,
            id: '$booking.id',
            source: '$booking.source',
            finance_source: '$booking.finance_source',
            vehicle_id: '$booking.vehicle_id',
            countDate: '$date',
            countAmount: '$amount',
          },
        },
        ...dimensions(query),
      ],
    },
  };
}

export function bookingPipeline(query, window) {
  const { from, to, previousFrom } = window;
  const activeRange = dateRange(previousFrom, to);
  return [
    {
      $match: {
        ...(query.source ? { finance_source: { $in: [query.source, null] } } : {}),
        $or: [
          {
            starts_at: activeRange,
            status: { $in: ['confirmed', 'active', 'inspecting', 'completed'] },
          },
          { ends_at: activeRange, status: 'completed' },
        ],
      },
    },
    {
      $unionWith: {
        coll: 'rentals',
        pipeline: [
          { $match: { return_at: activeRange } },
          lookup('bookings', 'booking_id', 'id', 'matchedBooking'),
          { $unwind: '$matchedBooking' },
          { $match: { 'matchedBooking.status': 'completed' } },
          { $replaceWith: '$matchedBooking' },
        ],
      },
    },
    { $group: { _id: '$id', booking: { $first: '$$ROOT' } } },
    { $replaceWith: '$booking' },
    lookup('rentals', 'id', 'booking_id', 'rental'),
    {
      $set: {
        serviceDate: {
          $cond: [
            { $eq: ['$status', 'completed'] },
            { $ifNull: [single('rental.return_at'), '$ends_at'] },
            null,
          ],
        },
      },
    },
    { $match: { $or: [{ starts_at: activeRange }, { serviceDate: activeRange }] } },
    ...dimensions(query),
    lookup('booking_addons', 'id', 'booking_id', 'legacyAddons'),
    lookup('addon_allocations', 'id', 'booking_id', 'allocations'),
    {
      $set: {
        gross: sum(
          '$base',
          '$extra',
          { $sum: '$legacyAddons.base' },
          { $sum: '$allocations.base' },
        ),
        taxes: sum('$tax', { $sum: '$legacyAddons.tax' }, { $sum: '$allocations.tax' }),
        discount: { $ifNull: ['$discount', 0] },
      },
    },
    { $set: { earned: { $subtract: ['$gross', '$discount'] } } },
    {
      $set: {
        bill: sum('$earned', '$taxes'),
        grossBill: sum('$gross', '$taxes'),
        countDate: '$serviceDate',
        countAmount: '$earned',
      },
    },
    cancellationOrders(query, activeRange),
    {
      $facet: {
        revenue: [
          { $match: { serviceDate: activeRange } },
          {
            $group: {
              _id: {
                current: { $gte: ['$serviceDate', from] },
                source: '$source',
                category: '$category',
                vehicleId: '$vehicle_id',
                bucket: bucket('$serviceDate', window),
              },
              vehicle: { $first: '$vehicle' },
              gross: { $sum: '$gross' },
              discount: { $sum: '$discount' },
              revenue: { $sum: '$earned' },
            },
          },
        ],
        counts: [
          { $match: { countDate: activeRange } },
          {
            $group: {
              _id: { current: { $gte: ['$countDate', from] }, order: '$order', member: '$id' },
              amount: { $sum: '$countAmount' },
              bucket: { $min: bucket('$countDate', window) },
            },
          },
          { $match: { amount: { $gt: 0 } } },
          {
            $group: {
              _id: { current: '$_id.current', order: '$_id.order' },
              bucket: { $min: '$bucket' },
            },
          },
          { $group: { _id: { current: '$_id.current', bucket: '$bucket' }, count: { $sum: 1 } } },
        ],
        current: [
          { $match: { starts_at: dateRange(from, to) } },
          ...balanceLookup(to),
          {
            $group: {
              _id: null,
              gross: { $sum: '$grossBill' },
              outstanding: { $sum: '$outstanding' },
            },
          },
        ],
        previous: [
          { $match: { starts_at: dateRange(previousFrom, from) } },
          ...balanceLookup(from),
          {
            $group: {
              _id: null,
              gross: { $sum: '$grossBill' },
              outstanding: { $sum: '$outstanding' },
            },
          },
        ],
      },
    },
  ];
}

const paymentBooking = (query) => [
  lookup('bookings', 'booking_id', 'id', 'booking'),
  { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } },
  {
    $set: {
      event: '$$ROOT',
      id: '$booking.id',
      source: '$booking.source',
      finance_source: '$booking.finance_source',
      vehicle_id: '$booking.vehicle_id',
      customer_id: '$booking.customer_id',
      bookingRef: '$booking.reference',
      bookingStatus: '$booking.status',
    },
  },
  ...dimensions(query),
];
function cashStatus(status) {
  if (status === 'completed') return settled;
  if (status === 'failed' || status === 'voided') return status;
  return { $nin: [...settled.$in, 'failed', 'voided'] };
}

function cashBranch(query, from, to, refunds, { summary, opening = false }) {
  const dimensionsNeeded = !summary || Boolean(query.source || query.category || query.vehicleId);
  return [
    {
      $match: {
        created_at: dateRange(from, to),
        ...(summary ? { status: settled, amount: { $gt: 0 } } : {}),
        ...(query.status && !refunds && !summary ? { status: cashStatus(query.status) } : {}),
        ...(opening && !refunds ? { purpose: 'deposit' } : {}),
      },
    },
    ...(refunds
      ? [
          lookup('payments', 'payment_id', 'id', 'payment'),
          { $unwind: '$payment' },
          {
            $set: {
              booking_id: '$payment.booking_id',
              purpose: '$payment.purpose',
              method: '$payment.method',
              notes: '$reason',
              parentStatus: { $ifNull: ['$payment.status', 'completed'] },
            },
          },
        ]
      : [{ $set: { notes: '$note', parentStatus: 'completed' } }]),
    ...(refunds && (summary || opening)
      ? [
          {
            $match: {
              ...(summary ? { parentStatus: { $in: settled.$in.filter(Boolean) } } : {}),
              ...(opening ? { purpose: 'deposit' } : {}),
            },
          },
        ]
      : []),
    ...(dimensionsNeeded ? paymentBooking(query) : [{ $set: { event: '$$ROOT' } }]),
    ...(summary
      ? []
      : [
          lookup('customers', 'customer_id', 'id', 'customerDoc'),
          lookup('booking_contacts', 'event.booking_id', 'booking_id', 'contacts'),
        ]),
    {
      $project: {
        _id: 0,
        id: '$event.id',
        bookingId: '$event.booking_id',
        paymentId: refunds ? '$event.payment_id' : '$event.id',
        date: '$event.created_at',
        amount: '$event.amount',
        method: '$event.method',
        notes: '$event.notes',
        reference: '$event.reference_number',
        staffId: '$event.staff_id',
        status: {
          $switch: {
            branches: [
              {
                case: { $in: ['$event.parentStatus', ['failed', 'voided']] },
                then: '$event.parentStatus',
              },
              {
                case: {
                  $not: [
                    { $in: ['$event.parentStatus', ['completed', 'succeeded', 'paid', 'success']] },
                  ],
                },
                then: 'pending',
              },
              {
                case: {
                  $in: [
                    { $ifNull: ['$event.status', 'completed'] },
                    ['completed', 'succeeded', 'paid', 'success'],
                  ],
                },
                then: 'completed',
              },
              { case: { $in: ['$event.status', ['failed', 'voided']] }, then: '$event.status' },
            ],
            default: 'pending',
          },
        },
        type: {
          $cond: [
            { $eq: ['$event.purpose', 'deposit'] },
            refunds ? 'deposit_return' : 'deposit_collection',
            refunds ? 'refund' : 'payment',
          ],
        },
        source: 1,
        category: 1,
        vehicle: 1,
        vehicleId: '$vehicle_id',
        bookingRef: 1,
        bookingStatus: 1,
        customer: { $ifNull: [single('contacts.name'), single('customerDoc.name')] },
      },
    },
  ];
}
export function expenseBranch(query, from, to) {
  return [
    {
      $match: {
        date: dateRange(from, to),
        ...(query.expenseCategory ? { category: query.expenseCategory } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.source ? { $expr: false } : {}),
      },
    },
    { $set: { vehicle_id: '$vehicleId', expenseCategory: '$category' } },
    ...vehicleStages,
    { $match: dimensionMatch(query, { expenses: true }) },
    {
      $project: {
        _id: 0,
        id: '$_id',
        type: { $literal: 'expense' },
        title: 1,
        date: 1,
        localDate: 1,
        expenseCategory: 1,
        category: 1,
        amount: 1,
        method: 1,
        status: 1,
        vendor: 1,
        notes: 1,
        receipt: 1,
        reference: '$receipt',
        version: 1,
        vehicleId: 1,
        vehicle: 1,
        staffId: 1,
        reversedAt: 1,
        reversalOf: 1,
      },
    },
  ];
}

export function adjustmentBranch(query, from, to) {
  return [
    { $match: { date: dateRange(from, to) } },
    { $set: { booking_id: '$bookingId' } },
    ...paymentBooking(query),
    {
      $project: {
        _id: 0,
        id: '$event._id',
        notes: '$event.notes',
        date: '$event.date',
        amount: '$event.amount',
        reference: '$event.reference',
        staffId: '$event.staffId',
        adjustmentKind: '$event.kind',
        bookingId: '$event.bookingId',
        source: 1,
        category: 1,
        vehicle: 1,
        vehicleId: '$vehicle_id',
        bookingRef: 1,
        type: { $literal: 'adjustment' },
        status: { $literal: 'completed' },
      },
    },
  ];
}

export function ledgerPipeline(
  query,
  from,
  to,
  { withExpenses = !query.source, summary = false } = {},
) {
  return [
    ...cashBranch(query, from, to, false, { summary }),
    { $unionWith: { coll: 'refunds', pipeline: cashBranch(query, from, to, true, { summary }) } },
    { $unionWith: { coll: 'finance_adjustments', pipeline: adjustmentBranch(query, from, to) } },
    ...(withExpenses
      ? [{ $unionWith: { coll: 'expenses', pipeline: expenseBranch(query, from, to) } }]
      : []),
  ];
}

export function activityPipeline(query, window) {
  return [
    ...ledgerPipeline(
      { ...query, expenseCategory: undefined, status: undefined },
      window.previousFrom,
      window.to,
      {
        summary: true,
      },
    ),
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: {
          current: { $gte: ['$date', window.from] },
          bucket: bucket('$date', window),
          type: '$type',
          method: { $cond: [{ $eq: ['$type', 'payment'] }, '$method', null] },
          source: { $cond: [{ $eq: ['$type', 'adjustment'] }, '$source', null] },
          category: { $cond: [{ $eq: ['$type', 'adjustment'] }, '$category', null] },
          vehicleId: { $cond: [{ $eq: ['$type', 'adjustment'] }, '$vehicleId', null] },
          adjustmentKind: '$adjustmentKind',
        },
        vehicle: { $first: '$vehicle' },
        amount: { $sum: '$amount' },
      },
    },
  ];
}

export function openingDepositPipeline(query, to) {
  const options = { summary: true, opening: true };
  return [
    ...cashBranch(query, null, to, false, options),
    { $unionWith: { coll: 'refunds', pipeline: cashBranch(query, null, to, true, options) } },
    {
      $group: {
        _id: null,
        amount: {
          $sum: {
            $cond: [
              { $eq: ['$type', 'deposit_return'] },
              { $multiply: ['$amount', -1] },
              '$amount',
            ],
          },
        },
      },
    },
  ];
}
