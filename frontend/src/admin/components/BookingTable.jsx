import { formatTime, money } from '../../utils/formatters.js';
import { Status } from '../../components/common/StatusBadge.jsx';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './BookingTable.css';
export function BookingTable({ bookings, onSelect }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Booking / customer</th>
            <th>Vehicle</th>
            <th>Schedule · IST</th>
            <th>Source</th>
            <th>Status</th>
            <th>Balance</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>
                <strong>{b.customer.name}</strong>
                <small>{b.reference}</small>
              </td>
              <td>
                <strong>{b.vehicle.name}</strong>
                <small>{b.vehicle.registration}</small>
              </td>
              <td>
                <span>{formatTime(b.starts_at)}</span>
                <small>to {formatTime(b.ends_at)}</small>
              </td>
              <td>
                <span className="source-badge">{b.source}</span>
              </td>
              <td>
                <Status value={b.overdue ? 'Overdue' : b.status} />
              </td>
              <td>
                <strong>{money(b.outstanding)}</strong>
                <small>of {money(b.total)}</small>
              </td>
              <td>
                {onSelect ? (
                  <button className="table-action" onClick={() => onSelect(b)}>
                    Manage <ArrowUpRight size={13} />
                  </button>
                ) : (
                  <Link className="table-action" to="/admin/bookings">
                    View <ArrowUpRight size={13} />
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!bookings.length && <div className="empty-state">No bookings match your filters.</div>}
    </div>
  );
}
