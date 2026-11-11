import { Status } from '../common/StatusBadge.jsx';
import { paymentLabels } from '../../utils/bookingStatus.js';
import './BookingStatusSummary.css';

export function BookingStatusSummary({ booking }) {
  const payment = booking.paymentState;
  return (
    <div className="booking-status-summary" aria-label="Booking and payment status">
      <Status value={booking.status} />
      <span
        className="booking-status-summary__pill"
        data-tone={
          payment === 'paid' ? 'success' : payment === 'not_required' ? 'neutral' : 'warning'
        }
        aria-label="Payment status"
      >
        {paymentLabels[payment] || 'Payment status unavailable'}
      </span>
      {booking.rentalState === 'returned' && (
        <span className="booking-status-summary__pill" data-tone="success">
          Returned to shop
        </span>
      )}
      {booking.rentalState === 'overdue' && (
        <span className="booking-status-summary__pill" data-tone="danger">
          Time ended · Not returned
        </span>
      )}
      {booking.rentalState === 'expired' && (
        <span className="booking-status-summary__pill" data-tone="warning">
          Time ended · Pickup not recorded
        </span>
      )}
    </div>
  );
}
export function BookingTimingNotice({ booking }) {
  if (booking.rentalState !== 'overdue' && booking.rentalState !== 'expired') return null;
  return (
    <p
      className="booking-timing-notice"
      data-overdue={booking.rentalState === 'overdue'}
      role="status"
    >
      {booking.rentalState === 'overdue'
        ? 'Rental time has ended. This vehicle has not been returned to the shop.'
        : 'The scheduled booking time has ended, but pickup has not been recorded. Contact the shop to confirm the next step.'}
    </p>
  );
}
