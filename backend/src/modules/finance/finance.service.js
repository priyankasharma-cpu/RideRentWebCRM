import { DateTime, IANAZone } from 'luxon';
import { collection, mongoOptions, withTransaction } from '../../config/mongoDatabase.js';
import { fail } from '../../utils/ApiError.js';
import { integerMoney } from '../../utils/money.js';
import { id } from '../../utils/crypto.js';
import { now } from '../../utils/dateTime.js';
import { findShopSettings } from '../settings/settings.repository.js';
import { audit } from '../audit/audit.service.js';
import { reportWindow, sources } from './finance.validation.js';
import { bookingView } from '../bookings/booking.read.service.js';
import { cancellationFeeBalance } from './finance.balance.js';
import {
  activityPipeline,
  bookingPipeline,
  expenseBranch,
  ledgerPipeline,
  lookup,
  openingDepositPipeline,
} from './finance.pipelines.js';

export async function financeContext(db, query) {
  const stored = await findShopSettings(db);
  const shop = stored ? JSON.parse(stored.data) : {};
  const timezone = IANAZone.isValidZone(shop.timezone || '') ? shop.timezone : 'Asia/Kolkata';
  return {
    shop: shop.name || 'RideRent',
    currency: 'INR',
    generatedAt: now(),
    ...reportWindow(query, timezone),
    filters: { source: query.source, category: query.category, vehicleId: query.vehicleId },
  };
}

const aggregate = (db, name, pipeline) =>
  collection(db, name).aggregate(
    pipeline,
    mongoOptions(db, { allowDiskUse: true, maxTimeMS: 15000 }),
  );
const addMoney = (a, b) => integerMoney(a + b);
const total = (rows, field) => rows.reduce((sum, row) => addMoney(sum, row[field]), 0);
const blank = () => ({
  revenue: 0,
  website: 0,
  walk_in: 0,
  unknown: 0,
  grossBooking: 0,
  payments: 0,
  outstanding: 0,
  refunds: 0,
  netCollections: 0,
  expenses: 0,
  profit: 0,
  average: 0,
  bookings: 0,
  grossRental: 0,
  discounts: 0,
  adjustments: 0,
  cancellationFees: 0,
  depositsCollected: 0,
  depositsReturned: 0,
  depositsNet: 0,
  depositsHeld: 0,
  margin: null,
});
const cashFields = {
  payment: 'payments',
  refund: 'refunds',
  expense: 'expenses',
  adjustment: 'adjustments',
  deposit_collection: 'depositsCollected',
  deposit_return: 'depositsReturned',
};
const blankPoint = (date) => ({
  date,
  website: 0,
  walk_in: 0,
  unknown: 0,
  revenue: 0,
  expenses: 0,
  profit: 0,
  bookings: 0,
});
function collect(group, key, name, amount) {
  const row = group.get(key) || { id: key, name, amount: 0 };
  row.amount = addMoney(row.amount, amount);
  group.set(key, row);
}
function datesForChart(window) {
  let start = DateTime.fromISO(window.from, { zone: window.timezone }).startOf(window.interval);
  const end = DateTime.fromISO(window.to, { zone: window.timezone });
  const rows = new Map();
  while (start < end) {
    rows.set(start.toISODate(), blankPoint(start.toISODate()));
    start = start.plus({ [window.interval]: 1 });
  }
  return rows;
}

export function summarizeFinance(bookings, activities, window, openingDeposits = 0) {
  const current = blank();
  const previous = blank();
  const chart = datesForChart(window);
  const categories = new Map(),
    vehicles = new Map(),
    methods = new Map();
  const point = (bucket) =>
    bucket && chart.get(DateTime.fromJSDate(bucket, { zone: window.timezone }).toISODate());
  function recordRevenue(row, amount) {
    const key = row._id;
    const metrics = key.current ? current : previous;
    const source = sources.includes(key.source) ? key.source : 'unknown';
    metrics[source] = addMoney(metrics[source], amount);
    if (!key.current) return;
    const item = point(key.bucket);
    if (item) item[source] = addMoney(item[source], amount);
    collect(categories, key.category || 'Uncategorized', key.category || 'Uncategorized', amount);
    const vehicle = key.vehicleId || 'unknown';
    collect(vehicles, vehicle, row.vehicle || 'Unknown vehicle', amount);
  }
  for (const row of bookings.revenue) {
    const metrics = row._id.current ? current : previous;
    metrics.grossRental = addMoney(metrics.grossRental, row.gross);
    metrics.discounts = addMoney(metrics.discounts, row.discount);
    recordRevenue(row, row.revenue);
  }
  for (const row of bookings.counts) {
    const metrics = row._id.current ? current : previous;
    metrics.bookings += row.count;
    const item = row._id.current && point(row._id.bucket);
    if (item) item.bookings += row.count;
  }
  for (const row of activities) {
    const key = row._id;
    const metrics = key.current ? current : previous;
    const field = cashFields[key.type];
    if (!field) continue;
    metrics[field] = addMoney(metrics[field], row.amount);
    if (key.type === 'adjustment') {
      recordRevenue(row, row.amount);
      if (key.adjustmentKind === 'cancellation_fee') {
        metrics.cancellationFees = addMoney(metrics.cancellationFees, row.amount);
      }
    }
    if (!key.current) continue;
    if (key.type === 'expense') {
      const item = point(key.bucket);
      if (item) item.expenses = addMoney(item.expenses, row.amount);
    }
    if (key.type === 'payment') {
      const method = key.method || 'Other';
      collect(methods, method, method, row.amount);
    }
  }
  for (const [metrics, balance] of [
    [current, bookings.current],
    [previous, bookings.previous],
  ]) {
    metrics.grossBooking = balance[0]?.gross || 0;
    metrics.outstanding = balance[0]?.outstanding || 0;
    metrics.revenue = total(
      sources.map((source) => ({ amount: metrics[source] })),
      'amount',
    );
    metrics.netCollections = addMoney(metrics.payments, -metrics.refunds);
    metrics.depositsNet = addMoney(metrics.depositsCollected, -metrics.depositsReturned);
    metrics.profit = addMoney(metrics.revenue, -metrics.expenses);
    const numerator = BigInt(metrics.revenue);
    const orders = BigInt(metrics.bookings);
    const magnitude = numerator < 0n ? -numerator : numerator;
    metrics.average = orders
      ? Number((magnitude + orders / 2n) / orders) * Math.sign(metrics.revenue)
      : 0;
    metrics.margin = metrics.revenue > 0 ? (metrics.profit / metrics.revenue) * 100 : null;
  }
  previous.depositsHeld = addMoney(openingDeposits, previous.depositsNet);
  current.depositsHeld = addMoney(previous.depositsHeld, current.depositsNet);
  const changes = Object.fromEntries(
    Object.keys(current).map((key) => [
      key,
      !previous[key] || current[key] === null
        ? null
        : ((current[key] - previous[key]) / Math.abs(previous[key])) * 100,
    ]),
  );
  const series = Array.from(chart.values(), (item) => {
    const revenue = addMoney(addMoney(item.website, item.walk_in), item.unknown);
    return { ...item, revenue, profit: addMoney(revenue, -item.expenses) };
  });
  const ranked = (map) =>
    Array.from(map.values()).sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
  const sourceRows = sources.map((source) => ({ id: source, amount: current[source] }));
  return {
    current,
    previous,
    changes,
    series,
    sources: sourceRows,
    categories: ranked(categories),
    vehicles: ranked(vehicles),
    methods: ranked(methods),
  };
}

export async function financeOverview(db, query, window) {
  const [bookingRows, activities, opening] = await Promise.all([
    aggregate(db, 'bookings', bookingPipeline(query, window)).toArray(),
    aggregate(db, 'payments', activityPipeline(query, window)).toArray(),
    aggregate(db, 'payments', openingDepositPipeline(query, window.previousFrom)).toArray(),
  ]);
  const bookings = bookingRows[0] || { revenue: [], counts: [], current: [], previous: [] };
  return { ...window, ...summarizeFinance(bookings, activities, window, opening[0]?.amount || 0) };
}

const sorts = {
  newest: { date: -1, id: 1 },
  oldest: { date: 1, id: 1 },
  highest: { amount: -1, id: 1 },
  lowest: { amount: 1, id: 1 },
};
const searchFields = [
  'id',
  'paymentId',
  'reference',
  'bookingRef',
  'customer',
  'vehicle',
  'notes',
  'title',
  'vendor',
];
function filterRows(query) {
  const pattern = query.search ? new RegExp(RegExp.escape(query.search), 'i') : null;
  return {
    $match: {
      ...(query.method ? { method: query.method } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.expenseCategory ? { expenseCategory: query.expenseCategory } : {}),
      ...(pattern ? { $or: searchFields.map((field) => ({ [field]: pattern })) } : {}),
    },
  };
}
const staff = [
  lookup('users', 'staffId', 'id', 'staff'),
  { $set: { recordedBy: { $ifNull: [{ $first: '$staff.name' }, '$staffId'] } } },
  { $unset: 'staff' },
];

export function listPipeline(query, window, expensesOnly = false) {
  const base = expensesOnly
    ? expenseBranch(query, window.from, window.to)
    : ledgerPipeline(query, window.from, window.to);
  return [...base, filterRows(query)];
}

export async function listFinanceRows(db, query, window, expensesOnly = false) {
  const [result] = await aggregate(db, expensesOnly ? 'expenses' : 'payments', [
    ...listPipeline(query, window, expensesOnly),
    {
      $facet: {
        total: [{ $count: 'count' }],
        rows: [
          { $sort: sorts[query.sort] },
          { $skip: (query.page - 1) * query.limit },
          { $limit: query.limit },
          ...staff,
        ],
      },
    },
  ]).toArray();
  return {
    rows: result?.rows || [],
    total: result?.total[0]?.count || 0,
    page: query.page,
    limit: query.limit,
  };
}

export const MAX_EXPORT_ROWS = 5000;
export async function exportFinanceRows(db, query, window) {
  const expensesOnly = query.report === 'expenses';
  const rows = await aggregate(db, expensesOnly ? 'expenses' : 'payments', [
    ...listPipeline(query, window, expensesOnly),
    { $sort: sorts[query.sort] },
    { $limit: MAX_EXPORT_ROWS + 1 },
    ...staff,
  ]).toArray();
  if (rows.length > MAX_EXPORT_ROWS)
    fail(422, 'Export exceeds 5,000 transactions. Narrow the period or filters.');
  return rows;
}

const read = (db, name, filter) => collection(db, name).findOne(filter, mongoOptions(db));

async function requireVehicle(db, vehicleId) {
  if (vehicleId && !(await read(db, 'vehicles', { id: vehicleId })))
    fail(404, 'Vehicle not found.');
}
function effectiveDate(date, timezone) {
  const value = DateTime.fromISO(date, { zone: timezone });
  if (value > DateTime.now().setZone(timezone).startOf('day'))
    fail(400, 'The effective date cannot be in the future.');
  return value.toUTC().toISO();
}

export async function saveExpense(db, user, input, timezone, expenseId) {
  return withTransaction(db, async () => {
    const expenses = collection(db, 'expenses');
    const { date, submissionKey, version, ...fields } = input;
    const payload = {
      ...fields,
      date: effectiveDate(date, timezone),
      localDate: date,
    };
    if (!expenseId) {
      const existing = await read(db, 'expenses', { _id: submissionKey });
      if (existing) {
        if (existing.creationPayload !== JSON.stringify(payload))
          fail(409, 'Submission key was already used.');
        return { id: existing._id, version: existing.version };
      }
    }
    await requireVehicle(db, input.vehicleId);
    const timestamp = now();
    if (expenseId) {
      const existing = await read(db, 'expenses', { _id: expenseId });
      if (!existing) fail(404, 'Expense not found.');
      if (existing.version !== version) fail(409, 'Expense changed. Refresh and try again.');
      if (existing.reversalOf) fail(409, 'Expense reversals are immutable.');
      if (existing.status === 'voided' && payload.status !== 'voided')
        fail(409, 'Voided expenses cannot be reopened.');
      if (
        existing.status === 'completed' &&
        (existing.amount !== payload.amount ||
          existing.date !== payload.date ||
          existing.status !== payload.status ||
          existing.method !== payload.method ||
          existing.vehicleId !== payload.vehicleId ||
          existing.category !== payload.category)
      )
        fail(409, 'Settled expense accounting fields are locked.');
      const next = { ...payload, updatedAt: timestamp, version: version + 1 };
      await expenses.updateOne({ _id: expenseId, version }, { $set: next }, mongoOptions(db));
      const before = { ...existing };
      delete before.creationPayload;
      await audit(db, user.id, 'finance.expense.updated', expenseId, { before, after: next });
      return { id: expenseId, version: next.version };
    }
    if (payload.status === 'voided') fail(400, 'Create a pending or completed expense.');
    const row = {
      _id: submissionKey || id(),
      ...payload,
      staffId: user.id,
      createdAt: timestamp,
      version: 1,
      creationPayload: JSON.stringify(payload),
    };
    await expenses.insertOne(row, mongoOptions(db));
    await audit(db, user.id, 'finance.expense.created', row._id, payload);
    return { id: row._id, version: row.version };
  });
}

export async function reverseExpense(db, user, expenseId, input, timezone) {
  return withTransaction(db, async () => {
    const expenses = collection(db, 'expenses');
    const date = effectiveDate(input.date, timezone);
    const fingerprint = JSON.stringify({
      expenseId,
      date,
      notes: input.notes,
      version: input.version,
    });
    const replay = await read(db, 'expenses', { _id: input.submissionKey });
    if (replay) {
      if (replay.creationPayload !== fingerprint) fail(409, 'Submission key was already used.');
      return { id: replay._id };
    }
    const original = await read(db, 'expenses', { _id: expenseId });
    if (!original) fail(404, 'Expense not found.');
    if (
      original.version !== input.version ||
      original.status !== 'completed' ||
      original.reversalOf ||
      original.reversedAt ||
      original.amount <= 0
    )
      fail(409, 'Only the current version of an unreversed settled expense can be reversed.');
    if (date < original.date) fail(400, 'Reversal date cannot precede the expense date.');
    const timestamp = now();
    const row = {
      _id: input.submissionKey,
      title: 'Reversal: ' + original.title,
      category: original.category,
      amount: -original.amount,
      date,
      localDate: input.date,
      method: original.method,
      vehicleId: original.vehicleId,
      status: 'completed',
      vendor: original.vendor,
      receipt: original.receipt,
      notes: input.notes,
      version: 1,
      staffId: user.id,
      createdAt: timestamp,
      reversalOf: expenseId,
      creationPayload: fingerprint,
    };
    await expenses.insertOne(row, mongoOptions(db));
    await expenses.updateOne(
      { _id: expenseId, version: input.version },
      {
        $set: { reversedAt: date, reversalId: row._id, updatedAt: timestamp },
        $inc: { version: 1 },
      },
      mongoOptions(db),
    );
    const details = {
      expenseId,
      reversalId: row._id,
      date,
      amount: row.amount,
      notes: input.notes,
    };
    await audit(db, user.id, 'finance.expense.reversed', expenseId, details);
    await audit(db, user.id, 'finance.expense.reversed', row._id, details);
    return { id: row._id };
  });
}

export async function expenseHistory(db, expenseId) {
  return aggregate(db, 'audit', [
    {
      $match: {
        entity_id: expenseId,
        action: {
          $in: ['finance.expense.created', 'finance.expense.updated', 'finance.expense.reversed'],
        },
      },
    },
    { $sort: { created_at: -1, id: 1 } },
    { $limit: 100 },
    { $project: { _id: 0, date: '$created_at', action: 1, staffId: '$user_id', details: 1 } },
    ...staff,
  ]).toArray();
}

export async function recordAdjustment(db, user, input, timezone) {
  return withTransaction(db, async () => {
    const { submissionKey, date, ...fields } = input;
    const row = { ...fields, date: effectiveDate(date, timezone) };
    const serialized = JSON.stringify(row);
    const existing = await read(db, 'finance_adjustments', { _id: submissionKey });
    if (existing) {
      if (existing.creationPayload !== serialized) fail(409, 'Submission key was already used.');
      return { id: existing._id };
    }
    const booking = await read(db, 'bookings', { id: input.bookingId });
    if (!booking) fail(404, 'Booking not found.');
    if (input.kind === 'cancellation_fee' && booking.status !== 'cancelled')
      fail(409, 'Cancellation fees require a cancelled booking.');
    if (input.kind === 'cancellation_fee') {
      const retained = await cancellationFeeBalance(db, booking.id);
      const view = await bookingView(db, booking);
      const next = addMoney(retained, input.amount);
      if (next < 0 || next > view.rentalPaid)
        fail(409, 'Cancellation fees must stay between zero and the retained rental payments.');
    }
    if (input.kind === 'revenue_adjustment' && booking.status !== 'completed')
      fail(409, 'Revenue adjustments require a completed booking.');
    await collection(db, 'finance_adjustments').insertOne(
      {
        _id: submissionKey,
        ...row,
        creationPayload: serialized,
        staffId: user.id,
        createdAt: now(),
      },
      mongoOptions(db),
    );
    await audit(db, user.id, 'finance.adjustment.recorded', submissionKey, row);
    return { id: submissionKey };
  });
}
