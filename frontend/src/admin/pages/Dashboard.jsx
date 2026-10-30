import { FleetCategoryChart } from '../features/dashboard/FleetCategoryChart.jsx';
import { useResource } from '../../hooks/useResource.js';
import { Loading } from '../../components/common/Loader.jsx';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { PageTitle } from '../components/PageTitle.jsx';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, CarFront, KeyRound, CalendarDays, Wallet } from 'lucide-react';
import { StatCard } from '../components/StatCard.jsx';
import { money } from '../../utils/formatters.js';
import { RevenueChart } from '../components/RevenueChart.jsx';
import { BookingTable } from '../components/BookingTable.jsx';
import './Dashboard.css';
export function Dashboard() {
  const { data, error, loading } = useResource('/admin/dashboard', 15000);
  if (loading) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  const k = data.kpis;
  return (
    <>
      <PageTitle
        title="A good day starts here."
        subtitle="Your fleet, your bookings, and what needs your attention."
      >
        <Link className="rr-button" to="/admin/create-booking">
          <Plus size={16} /> New Booking
        </Link>
      </PageTitle>
      <div className="overview-callout">
        <div>
          <span className="live-dot" /> LIVE OPERATIONS
        </div>
        <p>
          {k.overdue
            ? `${k.overdue} overdue rental${k.overdue > 1 ? 's' : ''} need your attention.`
            : 'Your workspace is up to date.'}{' '}
          {k.inspection ? `${k.inspection} return inspections pending.` : ''}
        </p>
        <Link to="/admin/active-rentals">
          View Active Rentals <ArrowRight size={15} />
        </Link>
      </div>
      <div className="stats-grid">
        <StatCard
          label="Total Vehicles"
          value={k.totalVehicles}
          icon={CarFront}
          detail={`${k.available} available · ${k.maintenance} in service`}
        />
        <StatCard
          label="Currently Rented"
          value={k.rented}
          icon={KeyRound}
          detail={`${k.overdue} overdue · ${k.reserved} reserved now`}
          tone="purple"
        />
        <StatCard
          label="Today’s Bookings"
          value={k.todayBookings}
          icon={CalendarDays}
          detail={`${k.todayPickups} pickups · ${k.todayReturns} returns`}
          tone="teal"
        />
        <StatCard
          label="Today’s Revenue"
          value={money(k.todayRevenue)}
          icon={Wallet}
          detail="Net rental receipts · deposits excluded"
          tone="orange"
        />
      </div>
      <div className="dashboard-chart-grid">
        <section className="rr-panel chart-panel">
          <div className="panel-title">
            <div>
              <h3>The journey in numbers</h3>
              <p>Net rental receipts over the last 7 days</p>
            </div>
            <strong>
              {money(data.daily.slice(-7).reduce((sum, d) => sum + d.revenue * 100, 0))}
            </strong>
          </div>
          <RevenueChart data={data.daily.slice(-7)} />
        </section>
        <FleetCategoryChart data={data} />
      </div>
      <div className="mini-stats">
        <div>
          <span>Monthly rental receipts</span>
          <strong>{money(k.monthlyRevenue)}</strong>
        </div>
        <div>
          <span>Outstanding balances</span>
          <strong>{money(k.outstanding)}</strong>
        </div>
        <div>
          <span>Completed journeys</span>
          <strong>{k.completed}</strong>
        </div>
        <div>
          <span>Awaiting inspection</span>
          <strong>{k.inspection}</strong>
        </div>
      </div>
      <section className="rr-panel table-panel">
        <div className="panel-title">
          <div>
            <h3>The latest journeys</h3>
            <p>Recently created reservations from every channel</p>
          </div>
          <Link to="/admin/bookings">
            All bookings <ArrowRight size={14} />
          </Link>
        </div>
        <BookingTable bookings={data.recent} />
      </section>
    </>
  );
}
