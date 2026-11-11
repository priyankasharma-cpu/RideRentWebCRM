import { money } from '../../../utils/formatters.js';
import './BookingCharges.css';
export function BookingCharges({ booking }) {
  return (
    <>
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
      {booking.addons?.length > 0 && (
        <section className="booking-addon-charges" aria-label="Booked helmets and add-ons">
          <h4>Helmets & add-ons · saved booking charges</h4>
          <dl>
            {booking.addons.map((addon) => (
              <div key={addon.id || addon.booking_id}>
                <dt>
                  {addon.name || 'Extra helmets'} × {addon.quantity}
                  <small>
                    {addon.included_quantity || 0} included ·{' '}
                    {addon.quantity - (addon.included_quantity || 0)} extra
                  </small>
                </dt>
                <dd>
                  {money(addon.base + addon.tax)}
                  <small>including tax</small>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  );
}
