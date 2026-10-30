import { api } from '../../../services/apiClient.js';
import './BookingActions.css';
export function BookingActions({ booking, busy, setAction, statusAction, execute, setBooking }) {
  return (
    <div className="manage-actions">
      {booking.status === 'confirmed' && (
        <>
          <button className="rr-button" disabled={busy} onClick={() => setAction('pickup')}>
            Mark as Picked Up
          </button>
          <button
            className="rr-button--outline"
            disabled={busy}
            onClick={() => setAction('reschedule')}
          >
            Reschedule
          </button>
          <button
            className="rr-button--danger"
            disabled={busy}
            onClick={() => window.confirm('Cancel this booking?') && statusAction('/cancel')}
          >
            Cancel
          </button>
        </>
      )}
      {booking.status === 'active' && (
        <button className="rr-button" onClick={() => setAction('return')}>
          Mark as Returned
        </button>
      )}
      {booking.status === 'inspecting' && (
        <button className="rr-button" disabled={busy} onClick={() => setAction('complete')}>
          Complete Inspection & Close
        </button>
      )}
      {!['cancelled', 'completed'].includes(booking.status) && booking.outstanding > 0 && (
        <button className="rr-button--outline" onClick={() => setAction('payments')}>
          Record Payment
        </button>
      )}
      {!booking.customer.verified && booking.status === 'confirmed' && (
        <button
          className="rr-button--outline"
          disabled={busy}
          onClick={async () => {
            const result = await execute(
              () =>
                api('/admin/customers/' + booking.customer.id, {
                  method: 'PATCH',
                  body: {
                    verified: true,
                  },
                }),
              'License marked verified.',
            );
            if (result)
              setBooking({
                ...booking,
                customer: {
                  ...booking.customer,
                  verified: 1,
                },
              });
          }}
        >
          Verify Driving License
        </button>
      )}
    </div>
  );
}
