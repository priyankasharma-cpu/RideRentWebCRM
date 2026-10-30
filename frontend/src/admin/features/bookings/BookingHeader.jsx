import { applyImageFallback } from '../../../config/imageConfig.js';
import { Status } from '../../../components/common/StatusBadge.jsx';
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
        <Status value={booking.overdue ? 'Overdue' : booking.status} />
      </div>
    </div>
  );
}
