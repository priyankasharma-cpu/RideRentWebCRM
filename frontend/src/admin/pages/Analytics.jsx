import { RentalStatusOverview } from '../features/analytics/RentalStatusOverview.jsx';
import { AnalyticsPeriodFilter } from '../features/analytics/AnalyticsPeriodFilter.jsx';
import { CategoryRevenueTable } from '../features/analytics/CategoryRevenueTable.jsx';
import { FleetPerformanceTable } from '../features/analytics/FleetPerformanceTable.jsx';
import { useResource } from '../../hooks/useResource.js';
import { useState } from 'react';
import { shopInput } from '../../utils/rentalTime.js';
import { Loading } from '../../components/common/Loader.jsx';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { PageTitle } from '../components/PageTitle.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { money } from '../../utils/formatters.js';
import { Wallet, CalendarDays, Check, X } from 'lucide-react';
import { RevenueChart } from '../components/RevenueChart.jsx';
import './Analytics.css';
export function Analytics() {
  const { data, error, loading } = useResource('/admin/dashboard', 15000),
    [range, setRange] = useState('7'),
    [from, setFrom] = useState(shopInput(Date.now() - 7 * 86400000).slice(0, 10)),
    [to, setTo] = useState(shopInput(Date.now()).slice(0, 10));
  if (loading) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  const daily =
    range === 'custom'
      ? data.daily.filter((d) => d.date >= from && d.date <= to)
      : range === 'yesterday'
        ? data.daily.slice(-2, -1)
        : range === 'month'
          ? data.daily.filter((d) => d.date.slice(0, 7) === data.daily.at(-1).date.slice(0, 7))
          : data.daily.slice(-Number(range));
  const revenue = daily.reduce((a, d) => a + d.revenue * 100, 0),
    count = daily.reduce((a, d) => a + d.bookings, 0);
  return (
    <>
      <PageTitle
        title="See where the road is taking you."
        subtitle="Database-driven performance. Rental receipts exclude refundable deposits."
      />
      <AnalyticsPeriodFilter
        range={range}
        setRange={setRange}
        data={data}
        from={from}
        setFrom={setFrom}
        to={to}
        setTo={setTo}
      />
      <div className="stats-grid">
        <StatCard label="Period rental receipts" value={money(revenue)} icon={Wallet} />
        <StatCard label="Period bookings created" value={count} icon={CalendarDays} />
        <StatCard label="All-time completed rentals" value={data.kpis.completed} icon={Check} />
        <StatCard label="All-time cancellations" value={data.kpis.cancelled} icon={X} />
      </div>
      <div className="mini-stats">
        <div>
          <span>Average booking value · all time</span>
          <strong>{money(data.kpis.averageBookingValue)}</strong>
        </div>
        <div>
          <span>Net rental receipts · all time</span>
          <strong>{money(data.kpis.totalRentalReceipts)}</strong>
        </div>
        <div>
          <span>Active rentals</span>
          <strong>{data.kpis.rented}</strong>
        </div>
        <div>
          <span>Overdue rentals</span>
          <strong>{data.kpis.overdue}</strong>
        </div>
      </div>
      <section className="rr-panel chart-panel">
        <div className="panel-title">
          <div>
            <h3>Rental receipts</h3>
            <p>Net rental payments grouped by receipt date · IST</p>
          </div>
        </div>
        <RevenueChart data={daily} />
      </section>
      <RentalStatusOverview daily={daily} data={data} />
      <FleetPerformanceTable data={data} />
      <CategoryRevenueTable data={data} />
    </>
  );
}
