import { Check } from 'lucide-react';
import { BookingStatusSummary } from './BookingStatusSummary.jsx';
import './BookingSuccess.css';
export function BookingSuccess({ booking }) {
  let heading = 'You’re all set to ride.';
  if (booking.status === 'cancelled') heading = 'Booking cancelled.';
  else if (booking.rentalState === 'returned' || booking.status === 'completed')
    heading = 'Your ride, returned.';
  else if (booking.status === 'active') heading = 'Your rental is in progress.';
  return (
    <div className="confirmation-heading">
      <span className="confirmation-check">
        <Check size={32} />
      </span>
      <div className="eyebrow">YOUR RIDE, RESERVED</div>
      <h1>{heading}</h1>
      <p>Keep your booking reference safe. Payment and return updates appear here.</p>
      <strong className="booking-reference">{booking.reference}</strong>
      <BookingStatusSummary booking={booking} />
    </div>
  );
}
