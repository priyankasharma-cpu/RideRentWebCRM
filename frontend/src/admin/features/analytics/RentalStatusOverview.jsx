import { BookingTrendChart } from './BookingTrendChart.jsx';
import { colors } from '../../../config/themeConfig.js';
import './RentalStatusOverview.css';
export function RentalStatusOverview({ daily, data }) {
  return (
    <div className="dashboard-chart-grid analytics-bottom">
      <section className="rr-panel chart-panel">
        <div className="panel-title">
          <div>
            <h3>Booking trends</h3>
            <p>Reservations created during your selected period</p>
          </div>
        </div>
        <BookingTrendChart daily={daily} />
      </section>
      <section className="rr-panel">
        <div className="panel-title">
          <div>
            <h3>All-time rental status</h3>
            <p>Current state of every booking</p>
          </div>
        </div>
        <div className="status-breakdown">
          {data.statuses.map((s, i) => (
            <div key={s.name}>
              <i
                style={{
                  background: colors[i],
                }}
              />
              <span>{s.name}</span>
              <strong>{s.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
