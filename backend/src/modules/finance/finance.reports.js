import { Buffer } from 'node:buffer';
import { exportFinanceRows, financeOverview } from './finance.service.js';

const labels = {
  revenue: 'Recognized rental revenue',
  website: 'Website revenue',
  walk_in: 'Walk-in revenue',
  unknown: 'Unclassified revenue',
  grossBooking: 'Gross booking value incl. tax',
  payments: 'Rental payments',
  outstanding: 'Outstanding rental payments',
  refunds: 'Rental refunds',
  netCollections: 'Net rental collections',
  expenses: 'Operating expenses',
  profit: 'Operating profit',
  average: 'Average booking value',
  bookings: 'Revenue-generating orders',
  grossRental: 'Gross rental revenue',
  discounts: 'Discounts',
  adjustments: 'Revenue adjustments',
  cancellationFees: 'Cancellation fees (included in adjustments)',
  depositsCollected: 'Deposits collected',
  depositsReturned: 'Deposits returned',
  depositsNet: 'Net deposit movement',
  depositsHeld: 'Refundable deposits held at period end',
  margin: 'Operating margin (%)',
};
const fields = [
  ['id', 'Transaction ID'],
  ['bookingRef', 'Booking reference'],
  ['customer', 'Customer'],
  ['vehicle', 'Vehicle'],
  ['source', 'Source'],
  ['type', 'Type'],
  ['expenseCategory', 'Expense category'],
  ['title', 'Expense title'],
  ['vendor', 'Vendor'],
  ['amount', 'Amount (INR)'],
  ['method', 'Method'],
  ['status', 'Status'],
  ['date', 'Date and time (UTC)'],
  ['recordedBy', 'Recorded by'],
  ['reference', 'Reference'],
  ['notes', 'Notes'],
];
const exportedValue = (key, value) => {
  if (value === null) return '';
  if (key === 'bookings') return value;
  if (key === 'margin') return Number(value.toFixed(2));
  return value / 100;
};
const profitKeys = [
  'grossRental',
  'discounts',
  'adjustments',
  'cancellationFees',
  'revenue',
  'expenses',
  'profit',
  'margin',
];
const sourceKeys = ['website', 'walk_in', 'unknown', 'revenue'];
const expenseStates = ['completed', 'pending', 'voided'];
export async function reportSections(db, query, window) {
  const [overview, ledger] = await Promise.all([
    financeOverview(db, query, window),
    exportFinanceRows(db, query, window),
  ]);
  const { current, previous } = overview;
  const sections = [
    {
      name: 'Report information',
      rows: [
        ['Shop', window.shop],
        ['Report', query.report],
        ['Currency', window.currency],
        ['Generated at (UTC)', window.generatedAt],
        ['From', window.fromDate],
        ['Through', window.toDate],
        ['Timezone', window.timezone],
        ['Source filter', query.source || 'All'],
        ['Category filter', query.category || 'All'],
        ['Vehicle filter', query.vehicleId || 'All'],
        ['Payment method filter', query.method || 'All'],
        ['Status filter', query.status || 'All'],
        ['Transaction type filter', query.type || 'All'],
        ['Expense category filter', query.expenseCategory || 'All'],
        ['Search', query.search || ''],
      ],
    },
  ];
  if (query.report === 'expenses') {
    sections.push({
      name: 'Expense totals',
      rows: [
        ['Status', 'Amount (INR)'],
        ...expenseStates.map((status) => [
          status,
          ledger.filter((row) => row.status === status).reduce((sum, row) => sum + row.amount, 0) /
            100,
        ]),
      ],
    });
  } else {
    const keys =
      query.report === 'profit-loss'
        ? profitKeys
        : query.report === 'source'
          ? sourceKeys
          : Object.keys(labels);
    sections.push({
      name: 'Financial totals',
      rows: [
        ['Metric', 'Current period', 'Previous period'],
        ...keys.map((key) => [
          labels[key],
          exportedValue(key, current[key]),
          exportedValue(key, previous[key]),
        ]),
      ],
    });
  }
  if (['summary', 'vehicle'].includes(query.report)) {
    sections.push({
      name: 'Vehicle revenue',
      rows: [
        ['Vehicle', 'Vehicle ID', 'Revenue (INR)'],
        ...overview.vehicles.map((row) => [row.name, row.id, row.amount / 100]),
      ],
    });
  }
  if (['summary', 'source', 'vehicle', 'profit-loss'].includes(query.report)) {
    sections.push({
      name: 'Trends',
      rows: [
        [
          'Period',
          'Website (INR)',
          'Walk-in (INR)',
          'Unclassified (INR)',
          'Revenue (INR)',
          'Expenses (INR)',
          'Profit (INR)',
          'Orders',
        ],
        ...overview.series.map((row) => [
          row.date,
          row.website / 100,
          row.walk_in / 100,
          row.unknown / 100,
          row.revenue / 100,
          row.expenses / 100,
          row.profit / 100,
          row.bookings,
        ]),
      ],
    });
  }
  if (query.report === 'transactions') {
    const totals = new Map();
    for (const row of ledger) {
      if (row.status === 'completed')
        totals.set(row.type, (totals.get(row.type) || 0) + row.amount);
    }
    sections.push({
      name: 'Filtered completed transactions',
      rows: [
        ['Transaction type', 'Total (INR)'],
        ...Array.from(totals, ([type, amount]) => [type, amount / 100]),
      ],
    });
  }
  sections.push({
    name: 'Transactions',
    rows: [
      fields.map(([, label]) => label),
      ...ledger.map((row) =>
        fields.map(([key]) => (key === 'amount' ? row.amount / 100 : (row[key] ?? ''))),
      ),
    ],
  });
  return sections;
}

export function csvCell(value) {
  if (typeof value === 'number') return String(value);
  const literal = String(value ?? '');
  const safe = /^[\s\p{Cc}]*[=+\-@]|^[\t\r\n]/u.test(literal) ? "'" + literal : literal;
  return '"' + safe.replaceAll('"', '""') + '"';
}
export async function renderReport(sections, format) {
  if (format === 'csv') {
    return {
      mime: 'text/csv; charset=utf-8',
      bytes:
        '\uFEFF' +
        sections
          .flatMap(({ name, rows }) => [
            csvCell(name),
            ...rows.map((row) => row.map(csvCell).join(',')),
            '',
          ])
          .join('\r\n'),
    };
  }
  if (format === 'xlsx') {
    const { default: XlsxPopulate } = await import('xlsx-populate');
    const workbook = await XlsxPopulate.fromBlankAsync();
    for (const [index, { name, rows }] of sections.entries()) {
      const sheet = index === 0 ? workbook.sheet(0).name(name) : workbook.addSheet(name);
      sheet.cell('A1').value(rows).style('verticalAlignment', 'top');
      sheet.row(1).style({ bold: true, fill: 'E6EEF7' });
      for (let column = 1; column <= rows[0].length; column++) sheet.column(column).width(24);
    }
    return {
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      bytes: Buffer.from(await workbook.outputAsync()),
    };
  }
  const { renderPdf } = await import('./finance.pdf.js');
  return renderPdf(sections);
}
