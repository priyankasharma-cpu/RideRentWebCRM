import { formatTime } from '../../../utils/formatters.js';
import { money } from '../../../utils/formatters.js';
import { api } from '../../../services/apiClient.js';
import './BookingLedger.css';
export function BookingLedger({ booking, user, busy, execute, setBooking }) {
  return (
    <div className="manage-history">
      <h3>Receipts & refunds</h3>
      {booking.payments.map((p) => (
        <div key={p.id}>
          <span>
            {p.purpose} · {p.method}
            <small>{formatTime(p.created_at)}</small>
          </span>
          <strong>{money(p.amount - p.refunded)}</strong>
          {user.role === 'admin' &&
            ['cancelled', 'completed'].includes(booking.status) &&
            (p.purpose === 'deposit' || booking.status === 'cancelled') &&
            p.refunded < p.amount && (
              <button
                className="rr-button--text"
                disabled={busy}
                onClick={async () => {
                  if (
                    !window.confirm(
                      `Record refund of ${money(p.amount - p.refunded)}? This does not transfer money.`,
                    )
                  )
                    return;
                  const result = await execute(
                    () =>
                      api('/admin/payments/' + p.id + '/refund', {
                        method: 'POST',
                        body: {
                          amount: p.amount - p.refunded,
                          reason:
                            booking.status === 'cancelled'
                              ? 'Cancelled booking refund'
                              : 'Security deposit returned',
                        },
                      }),
                    'Refund recorded.',
                  );
                  if (result) setBooking(await api('/bookings/' + booking.id));
                }}
              >
                Record Refund
              </button>
            )}
        </div>
      ))}
      {!booking.payments.length && <p className="subtle-note">No payments recorded yet.</p>}
      {booking.inspections.map((i) => (
        <div key={i.id}>
          <span>
            {i.type} inspection<small>{formatTime(i.created_at)}</small>
          </span>
          <span>
            {i.fuel} · {i.condition}
            <small>{i.notes}</small>
          </span>
        </div>
      ))}
    </div>
  );
}
