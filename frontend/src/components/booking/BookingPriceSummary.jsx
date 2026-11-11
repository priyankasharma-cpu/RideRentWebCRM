import { money } from '../../utils/formatters.js';
import { ErrorBox } from '../common/ErrorBox.jsx';
import './BookingPriceSummary.css';
export function BookingPriceSummary({ quote, changed }) {
  return (
    <section className="booking-price-summary" aria-labelledby="booking-price-title">
      <h2 id="booking-price-title">Rental estimate</h2>
      <ErrorBox>{quote.error}</ErrorBox>
      {quote.ready ? (
        <>
          <p className="booking-price-summary__duration">
            {quote.total.hours} billed hours · {quote.total.roundingMinutes}-minute billing blocks
          </p>
          <ul>
            {quote.lines.map(({ vehicle, quote: item }) => (
              <li key={vehicle.id}>
                <div>
                  <strong>{vehicle.name}</strong>
                  <small>
                    {money(item.rate)}/hour × {item.hours} hours × 1
                  </small>
                </div>
                <span>{money(item.base)}</span>
              </li>
            ))}
          </ul>
          <dl>
            <div>
              <dt>Vehicle rental subtotal</dt>
              <dd>{money(quote.total.base)}</dd>
            </div>
            <div>
              <dt>Add-ons selected</dt>
              <dd>None</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{money(quote.total.tax)}</dd>
            </div>
            <div>
              <dt>Refundable security deposit</dt>
              <dd>{money(quote.total.deposit)}</dd>
            </div>
            <div className="booking-price-summary__total">
              <dt>Total payable at pickup</dt>
              <dd>{money(quote.total.total)}</dd>
            </div>
          </dl>
          <p className="booking-price-summary__note">
            Combined estimate from current vehicle quotes. Vehicles are not reserved yet. Final
            availability is checked before a booking is confirmed.
          </p>
        </>
      ) : (
        <p className="booking-price-summary__note" role="status">
          {changed
            ? 'Apply your updated dates to refresh the estimate.'
            : quote.pending
              ? 'Getting current prices…'
              : 'Add available vehicles to see their server-calculated rental prices.'}
        </p>
      )}
    </section>
  );
}
