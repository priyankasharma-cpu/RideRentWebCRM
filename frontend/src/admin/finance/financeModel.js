export const base = '/admin/finance';
export const periods = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  last_week: 'Last Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  this_year: 'This Year',
  last_year: 'Last Year',
  custom: 'Custom Date Range',
};
export const sourceNames = { website: 'Website', walk_in: 'Walk-in', unknown: 'Unclassified' };
export const methods = ['Cash', 'UPI', 'Card', 'Online', 'Bank transfer', 'Other'];
export const statuses = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
  voided: 'Voided',
};
export const types = {
  payment: 'Rental payment',
  refund: 'Rental refund',
  deposit_collection: 'Deposit collection',
  deposit_return: 'Deposit return',
  expense: 'Expense',
  adjustment: 'Revenue adjustment',
};
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
export const reports = {
  summary: 'Finance summary',
  source: 'Revenue by source',
  vehicle: 'Revenue by vehicle',
  transactions: 'Transaction ledger',
  expenses: 'Expense report',
  'profit-loss': 'Profit & loss',
};
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const number = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });
export function money(amount) {
  if (!Number.isSafeInteger(amount)) return '—';
  const magnitude = BigInt(Math.abs(amount));
  const whole = Number(magnitude / 100n);
  const fraction = String(magnitude % 100n).padStart(2, '0');
  return currency
    .formatToParts(amount < 0 ? -whole : whole)
    .map((part) => (part.type === 'fraction' ? fraction : part.value))
    .join('');
}
export const percent = (value) => (value == null ? '—' : number.format(value) + '%');
export const count = (value) => number.format(value);
export const when = (value, timeZone) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone,
      }).format(new Date(value))
    : '—';
export function paise(value) {
  const match = /^(-?)(\d{1,7})(?:\.(\d{1,2}))?$/.exec(String(value).trim());
  if (!match) throw new Error('Enter a rupee amount with up to two decimal places.');
  const amount = Number(match[2]) * 100 + Number((match[3] || '').padEnd(2, '0'));
  if (!amount || amount > 100000000) throw new Error('Enter an amount from ₹0.01 to ₹10,00,000.');
  return match[1] ? -amount : amount;
}
export const searchParams = (params) =>
  new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value != null),
  ).toString();
export const reportPath = (params) => base + '/reports/export?' + searchParams(params);
