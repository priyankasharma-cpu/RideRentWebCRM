import { applyImageFallback } from '../../../config/imageConfig.js';
import { BookingStatusSummary } from '../../../components/booking/BookingStatusSummary.jsx';
import { rentalDuration } from '../../../utils/bookingStatus.js';
import './BookingHeader.css';
export function BookingHeader({ booking }) {
  return (
    <div className="manage-header">
      <img src={booking.vehicle.image} alt="" onError={applyImageFallback} decoding="async" />
      <div>
        <h3>{booking.vehicle.name}</h3>
        <p>
          {booking.customer.name} ·{' '}
          <a href={'tel:' + booking.customer.phone}>{booking.customer.phone}</a>
        </p>
        <p>Rental duration: {rentalDuration(booking.starts_at, booking.ends_at)}</p>
        <BookingStatusSummary booking={booking} />
      </div>
    </div>
  );
}
