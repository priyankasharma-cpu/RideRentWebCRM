import { Check } from 'lucide-react';
import { Status } from '../common/StatusBadge.jsx';
import './BookingSuccess.css';
export function BookingSuccess({ booking }) {
  return (
    <div className="confirmation-heading">
      <span className="confirmation-check">
        <Check size={32} />
      </span>
      <div className="eyebrow">YOUR RIDE, RESERVED</div>
      <h1>{booking.status === 'cancelled' ? 'Booking cancelled.' : 'You’re all set to ride.'}</h1>
      <p>Keep your booking reference safe. We’ll see you at the shop.</p>
      <strong className="booking-reference">{booking.reference}</strong>
      <Status value={booking.overdue ? 'Overdue' : booking.status} />
    </div>
  );
}
