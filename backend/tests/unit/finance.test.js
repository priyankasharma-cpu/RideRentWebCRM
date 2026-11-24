import assert from 'node:assert/strict';
import { test } from 'node:test';
import { financeQuery, reportWindow } from '../../src/modules/finance/finance.validation.js';
import { csvCell, renderReport } from '../../src/modules/finance/finance.reports.js';
import { summarizeFinance } from '../../src/modules/finance/finance.service.js';

const instant = new Date('2025-04-08T12:00:00.000Z');
const range = (period, options = {}, zone = 'Asia/Kolkata', date = instant) =>
  reportWindow(financeQuery.parse({ period, ...options }), zone, date);

test('shop-local midnight and half-open boundaries remain exact', () => {
  const before = range('today', {}, 'Asia/Kolkata', new Date('2025-04-07T18:29:59.999Z'));
  const after = range('today', {}, 'Asia/Kolkata', new Date('2025-04-07T18:30:00.000Z'));
  assert.equal(before.to, after.from);
  assert.equal(after.fromDate, '2025-04-08');
  assert.equal(range('yesterday').toDate, '2025-04-07');
  const dst = range('today', {}, 'America/New_York', new Date('2025-03-09T16:00:00Z'));
  assert.equal(Date.parse(dst.to) - Date.parse(dst.from), 23 * 3600000);
});

test('calendar week, month, quarter and year use the preceding calendar period', () => {
  const results = {
    this_week: ['2025-04-07', '2025-04-13', '2025-03-30T18:30:00.000Z'],
    last_week: ['2025-03-31', '2025-04-06', '2025-03-23T18:30:00.000Z'],
    this_month: ['2025-04-01', '2025-04-30', '2025-02-28T18:30:00.000Z'],
    last_month: ['2025-03-01', '2025-03-31', '2025-01-31T18:30:00.000Z'],
    this_quarter: ['2025-04-01', '2025-06-30', '2024-12-31T18:30:00.000Z'],
    this_year: ['2025-01-01', '2025-12-31', '2023-12-31T18:30:00.000Z'],
    last_year: ['2024-01-01', '2024-12-31', '2022-12-31T18:30:00.000Z'],
  };
  for (const [period, expected] of Object.entries(results)) {
    const { fromDate, toDate, previousFrom } = range(period);
    assert.deepEqual([fromDate, toDate, previousFrom], expected);
  }
});

test('custom windows compare the same number of calendar dates and validate filters', () => {
  const custom = range('custom', { from: '2024-02-27', to: '2024-02-29' });
  assert.equal(custom.previousFrom, '2024-02-23T18:30:00.000Z');
  assert.throws(() => range('custom', { from: '2025-05-01', to: '2025-04-30' }), /valid range/);
  assert.throws(() => range('custom', { from: '2025-05-01' }), /both custom report dates/);
  assert.throws(() => range('custom', { from: '2025-02-29', to: '2025-03-01' }));
  assert.throws(() => financeQuery.parse({ source: 'Phone', page: '0' }));
});

test('empty datasets have zero values, visible chart intervals and unavailable growth baselines', () => {
  const data = summarizeFinance(
    { revenue: [], counts: [], current: [], previous: [] },
    [],
    range('today'),
  );
  assert.equal(data.series.length, 1);
  assert.equal(data.current.bookings, 0);
  assert.equal(data.current.revenue, 0);
  assert.equal(data.current.margin, null);
  assert.equal(data.changes.revenue, null);
  assert.equal(data.sources.length, 3);
});

test('collection and profit arithmetic use independent sets of integer minor units', () => {
  const window = range('today');
  const key = { current: true, source: 'website', bucket: new Date(window.from) };
  const data = summarizeFinance(
    {
      revenue: [
        { _id: key, gross: 23301, discount: 301, revenue: 23000 },
        { _id: { ...key, current: false }, gross: 13000, discount: 0, revenue: 13000 },
      ],
      counts: [{ _id: key, count: 2 }],
      current: [{ gross: 83000, outstanding: 3001 }],
      previous: [],
    },
    [
      { _id: { ...key, type: 'payment', method: 'UPI' }, amount: 21001 },
      { _id: { ...key, type: 'refund' }, amount: 1000 },
      { _id: { ...key, type: 'deposit_collection' }, amount: 10000 },
      { _id: { ...key, type: 'deposit_return' }, amount: 7500 },
      { _id: { ...key, type: 'expense' }, amount: 5000 },
      { _id: { ...key, type: 'adjustment', adjustmentKind: 'cancellation_fee' }, amount: 3000 },
    ],
    window,
  );
  const metrics = data.current;
  assert.equal(metrics.revenue, 26000);
  assert.equal(metrics.profit, 21000);
  assert.equal(metrics.netCollections, 20001);
  assert.equal(metrics.depositsNet, 2500);
  assert.equal(metrics.cancellationFees, 3000);
  assert.equal(metrics.outstanding, 3001);
  assert.equal(metrics.average, 13000);
  assert.equal(data.changes.revenue, 100);
  assert.equal(data.changes.payments, null);
  assert.equal(data.series[0].profit, metrics.profit);
});

test('exports produce readable files and guard user-supplied CSV cells', async () => {
  const rows = [
    {
      name: 'Financial totals',
      rows: [
        ['Metric', 'INR'],
        ['Revenue', 100.01],
        ['=HYPERLINK("https://example.test")', -0.01],
      ],
    },
  ];
  const csv = (await renderReport(rows, 'csv')).bytes;
  assert.match(csv, /"Revenue",100.01/);
  assert.match(csv, /"'=HYPERLINK/);
  assert.equal(csvCell('- notes'), '"\'- notes"');
  assert.equal(csvCell(-12), '-12');
  assert.equal(csvCell('\t=18'), '"\'\t=18"');
  const spreadsheet = (await renderReport(rows, 'xlsx')).bytes;
  const { default: XlsxPopulate } = await import('xlsx-populate');
  const workbook = await XlsxPopulate.fromDataAsync(spreadsheet);
  assert.equal(workbook.sheet(0).cell('B2').value(), 100.01);
  assert.equal(workbook.sheet(0).cell('A3').formula(), undefined);
  const pdf = (await renderReport(rows, 'pdf')).bytes;
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
});
