import { money } from '../../../utils/formatters.js';
import './FleetPerformanceTable.css';
export function FleetPerformanceTable({ data }) {
  return (
    <section className="rr-panel table-panel">
      <div className="panel-title">
        <div>
          <h3>Your most booked rides</h3>
          <p>All-time non-cancelled reservations · net rental receipts · actual rental occupancy</p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Non-cancelled bookings</th>
              <th>Net rental receipts</th>
              <th>Utilization · last 30 days</th>
            </tr>
          </thead>
          <tbody>
            {data.utilization.map((v) => (
              <tr key={v.name}>
                <td>
                  <strong>{v.name}</strong>
                </td>
                <td>{v.bookings}</td>
                <td>{money(v.revenue * 100)}</td>
                <td>
                  {v.utilizationPercent}%
                  <small>{v.occupiedHours} hours physically rented / 720 calendar hours</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
