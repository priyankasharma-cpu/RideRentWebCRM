import { z } from 'zod';
import { DateTime } from 'luxon';
import { fail } from '../../utils/ApiError.js';

export const sources = ['website', 'walk_in', 'unknown'];
export const categories = ['Bike', 'Scooter', 'Car'];
export const methods = ['Cash', 'UPI', 'Card', 'Online', 'Bank transfer', 'Other'];
export const expenseCategories = [
  'Vehicle maintenance',
  'Vehicle repairs',
  'Fuel',
  'Insurance',
  'Shop rent',
  'Employee salaries',
  'Cleaning',
  'Marketing',
  'Utilities',
  'Vehicle servicing',
  'Other expenses',
];
export const periods = [
  'today',
  'yesterday',
  'this_week',
  'last_week',
  'this_month',
  'last_month',
  'this_quarter',
  'this_year',
  'last_year',
  'custom',
];
const units = ['day', 'week', 'month', 'quarter', 'year'];
const date = z.iso
  .date()
  .refine((value) => DateTime.fromISO(value).isValid, 'Invalid calendar date');
export const reference = z.string().trim().max(120).default('');
export const submissionKey = z.uuid();
export const positiveAmount = z.number().int().min(1).max(100000000);
export const transactionTypes = [
  'payment',
  'refund',
  'deposit_collection',
  'deposit_return',
  'expense',
  'adjustment',
];
export const reportTypes = [
  'summary',
  'source',
  'vehicle',
  'transactions',
  'expenses',
  'profit-loss',
];

export const financeQuery = z.object({
  period: z.enum(periods).default('this_month'),
  from: date.optional(),
  to: date.optional(),
  source: z.enum(sources).optional(),
  category: z.enum(categories).optional(),
  vehicleId: z.uuid().optional(),
  interval: z.enum(units).optional(),
  method: z.enum(methods).optional(),
  status: z.enum(['completed', 'pending', 'failed', 'voided']).optional(),
  type: z.enum(transactionTypes).optional(),
  expenseCategory: z.enum(expenseCategories).optional(),
  search: z.string().trim().max(100).default(''),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest']).default('newest'),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  format: z.enum(['csv', 'xlsx', 'pdf']).default('csv'),
  report: z.enum(reportTypes).default('summary'),
});

export const expenseInput = z.object({
  title: z.string().trim().min(1).max(150),
  category: z.enum(expenseCategories),
  amount: positiveAmount,
  date,
  method: z.enum(methods),
  vehicleId: z.uuid().nullable().default(null),
  status: z.enum(['pending', 'completed', 'voided']),
  vendor: z.string().trim().max(150).default(''),
  notes: z.string().trim().max(1000).default(''),
  receipt: reference,
});
export const adjustmentInput = z.object({
  bookingId: z.uuid(),
  amount: z.number().int().min(-100000000).max(100000000).refine(Boolean),
  kind: z.enum(['revenue_adjustment', 'cancellation_fee']),
  date,
  notes: z.string().trim().min(3).max(1000),
  reference,
  submissionKey,
});

export function reportWindow(query, timezone, now = new Date()) {
  const local = DateTime.fromJSDate(now, { zone: timezone });
  const [direction, name] = query.period.split('_');
  const unit = name || 'day';
  let start = local.startOf(unit);
  let end = start.plus({ [unit]: 1 });
  let previous;
  if (query.period === 'yesterday' || direction === 'last') {
    end = start;
    start = start.minus({ [unit]: 1 });
  }
  if (query.period === 'custom') {
    if (!query.from || !query.to) fail(400, 'Select both custom report dates.');
    start = DateTime.fromISO(query.from, { zone: timezone });
    end = DateTime.fromISO(query.to, { zone: timezone }).plus({ days: 1 });
    const days = end.diff(start, 'days').days;
    if (days < 1 || days > 3660) fail(400, 'Select a valid range of up to ten years.');
    previous = start.minus({ days });
  } else {
    previous = start.minus({ [unit]: 1 });
  }
  if (!start.isValid) fail(400, 'Invalid reporting timezone.');
  return {
    from: start.toUTC().toISO(),
    to: end.toUTC().toISO(),
    previousFrom: previous.toUTC().toISO(),
    fromDate: start.toISODate(),
    toDate: end.minus({ days: 1 }).toISODate(),
    timezone,
    interval:
      query.interval ||
      (end.diff(start, 'days').days <= 35 ? 'day' : unit === 'year' ? 'month' : 'week'),
  };
}
