import { money } from '../../../utils/formatters.js';
import './BookingCharges.css';
export function BookingCharges({ booking }) {
  return (
    <div className="manage-prices">
      <div>
        Rental incl. extras<strong>{money(booking.rentalTotal)}</strong>
      </div>
      <div>
        Deposit held<strong>{money(booking.depositPaid)}</strong>
      </div>
      <div>
        Outstanding<strong>{money(booking.outstanding)}</strong>
      </div>
    </div>
  );
}
