import { lazy, Suspense, useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { ExportControl, FinanceHeader, SelectField } from './FinanceControls.jsx';
import FinanceMetrics, { FinanceSkeleton, mainMetrics, sourceMetrics } from './FinanceMetrics.jsx';
import FinanceProfitLoss from './FinanceProfitLoss.jsx';
import { financeKey, useFinance } from './financeQueries.js';
import { searchParams } from './financeModel.js';
import { useResource } from '../../hooks/useResource.js';
import './FinancePage.css';

const Charts = lazy(() => import('./FinanceCharts.jsx'));
const Ledger = lazy(() => import('./FinanceLedger.jsx'));
const labels = {
  overview: [
    'Finance Management',
    'Track earned revenue, collections, and operating costs across the shop.',
  ],
  revenue: [
    'Revenue Analytics',
    'Compare booking channels, vehicles, and payment methods over time.',
  ],
  website: [
    'Website Revenue',
    'Review revenue and collections for bookings from the customer website.',
  ],
  'walk-in': [
    'Walk-in Revenue',
    'Review revenue and collections for customers who booked at the shop.',
  ],
  transactions: [
    'Transactions',
    'Review and record rental receipts, deposit movements, refunds, and adjustments.',
  ],
  expenses: [
    'Expenses',
    'Record operating costs, manage payment status, and inspect the audit history.',
  ],
  'profit-loss': [
    'Profit & Loss',
    'Compare recognized rental revenue with settled operating expenses.',
  ],
  reports: [
    'Financial Reports',
    'Download the financial statement or ledger for the selected reporting period.',
  ],
};
const reportFor = {
  website: 'source',
  'walk-in': 'source',
  revenue: 'source',
  'profit-loss': 'profit-loss',
  transactions: 'transactions',
  expenses: 'expenses',
};
const depositKeys = ['depositsCollected', 'depositsReturned', 'depositsNet', 'depositsHeld'];

function Reports({ filters, setFilter, ready, data }) {
  const vehicles = useResource('/admin/vehicles');
  const options = Object.fromEntries(
    (vehicles.data || [])
      .filter((vehicle) => !filters.category || vehicle.category === filters.category)
      .map((vehicle) => [vehicle.id, vehicle.name + ' · ' + vehicle.registration]),
  );
  return (
    <section className="finance-card">
      <h2>Download a report</h2>
      {data && (
        <p>
          {data.fromDate} through {data.toDate} · {data.timezone} · {data.currency}
        </p>
      )}
      <div className="finance-controls">
        <SelectField
          label="Vehicle"
          value={filters.vehicleId}
          options={options}
          blank="All vehicles"
          onChange={(value) => setFilter('vehicleId', value)}
          disabled={vehicles.loading || Boolean(vehicles.error)}
        />
        <ExportControl full filters={filters} disabled={!ready} />
      </div>
      {vehicles.error && (
        <p role="alert" className="finance-error">
          {vehicles.error}
        </p>
      )}
    </section>
  );
}

export default function FinancePage({ page }) {
  const client = useQueryClient();
  const refreshing = useIsFetching({ queryKey: financeKey }) > 0;
  const source = page === 'website' ? 'website' : page === 'walk-in' ? 'walk_in' : '';
  const [filters, updateFilters] = useState({
    period: 'this_month',
    from: '',
    to: '',
    source,
    category: '',
    interval: '',
    vehicleId: '',
  });
  const setFilter = (key, value) =>
    updateFilters((existing) => ({
      ...existing,
      ...(key === 'category' ? { vehicleId: '' } : {}),
      [key]: value,
    }));
  const activeFilters = filters.period === 'custom' ? filters : { ...filters, from: '', to: '' };
  const valid =
    filters.period !== 'custom' ||
    Boolean(filters.from && filters.to && filters.from <= filters.to);
  const tablePage = ['transactions', 'expenses'].includes(page);
  const overview = useFinance('/overview', activeFilters, valid && !tablePage);
  const [lastTableUpdate, setLastTableUpdate] = useState(null);
  const data = overview.data;
  const updated = tablePage ? lastTableUpdate : data;
  const timeframe = updated?.timezone || 'Asia/Kolkata';
  const maxDate = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timeframe,
  }).format(new Date());
  const [title, description] = labels[page];
  const showCharts = !tablePage && page !== 'reports';
  const refresh = () => client.invalidateQueries({ queryKey: financeKey });
  const keys = source
    ? sourceMetrics
    : page === 'revenue'
      ? ['revenue', 'website', 'walk_in', 'bookings']
      : mainMetrics;
  const renderedKeys =
    !source && (data?.current.unknown || data?.previous.unknown) ? [...keys, 'unknown'] : keys;
  return (
    <div className="finance">
      <FinanceHeader
        title={title}
        description={description}
        filters={filters}
        setFilter={setFilter}
        sourceLocked={Boolean(source)}
        showInterval={showCharts || page === 'reports'}
        showSource={page !== 'expenses'}
        updated={updated}
        refresh={refresh}
        refreshing={refreshing}
        extra={
          !tablePage &&
          page !== 'reports' && (
            <ExportControl filters={activeFilters} report={reportFor[page]} disabled={!valid} />
          )
        }
      />
      {valid ? (
        <>
          {!tablePage && overview.isPending && (
            <FinanceSkeleton count={page === 'overview' ? 8 : 4} />
          )}
          {!tablePage && overview.isError && (
            <section className="finance-card">
              <p role="alert" className="finance-error">
                {overview.error.message}
              </p>
            </section>
          )}
          {page === 'reports' && (
            <Reports filters={activeFilters} setFilter={setFilter} ready={valid} data={data} />
          )}
          {data && page !== 'reports' && (
            <>
              {(filters.source || filters.category) &&
                ['overview', 'revenue', 'profit-loss'].includes(page) && (
                  <p className="finance-scope">
                    {filters.source
                      ? 'Source filters omit operating expenses, which are recorded at shop or vehicle level.'
                      : 'Category filters include expenses assigned to matching vehicles. Shared shop expenses appear in the all-category view.'}
                  </p>
                )}
              {page === 'profit-loss' ? (
                <FinanceProfitLoss data={data} />
              ) : (
                <FinanceMetrics keys={renderedKeys} data={data} />
              )}
              {page === 'overview' && (
                <section aria-labelledby="finance-deposits">
                  <h2 id="finance-deposits">Refundable security deposits</h2>
                  <FinanceMetrics keys={depositKeys} data={data} />
                </section>
              )}
              {showCharts && (
                <Suspense fallback={<FinanceSkeleton count={2} />}>
                  <Charts data={data} page={page} />
                </Suspense>
              )}
            </>
          )}
          {(tablePage || source) && (
            <Suspense fallback={<FinanceSkeleton count={2} />}>
              <Ledger
                key={searchParams(activeFilters)}
                filters={activeFilters}
                showActions={tablePage}
                maxDate={maxDate}
                onLoaded={tablePage ? setLastTableUpdate : undefined}
                kind={page === 'expenses' ? 'expenses' : 'transactions'}
              />
            </Suspense>
          )}
        </>
      ) : (
        <p role="status" className="finance-card">
          Select a valid start and end date to run the report.
        </p>
      )}
    </div>
  );
}
