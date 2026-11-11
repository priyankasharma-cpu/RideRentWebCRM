import { useEffect, useRef } from 'react';
import { ClipboardCheck, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatTime } from '../../utils/formatters.js';
import { toUTC } from '../../utils/rentalTime.js';
import { CallLink } from '../common/CallLink.jsx';
import './BookingReview.css';
export function BookingReview({ customer, period, lines, quote, onEdit }) {
  const headingRef = useRef(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  const single = lines.length === 1 && lines[0].quantity === 1 && lines[0].vehicles.length === 1;
  const checkout = single
    ? '/checkout?' + new URLSearchParams({ vehicle: lines[0].vehicles[0].id, ...period })
    : '';
  return (
    <section className="group-booking__panel booking-review" aria-labelledby="booking-review-title">
      <h2 ref={headingRef} tabIndex={-1} id="booking-review-title">
        <ClipboardCheck size={21} aria-hidden="true" />
        Review your selection
      </h2>
      <p>This is a review of your plans. No reservation has been created.</p>
      <dl>
        <div>
          <dt>Full name</dt>
          <dd>{customer.name}</dd>
        </div>
        <div>
          <dt>Mobile</dt>
          <dd>{customer.phone}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{customer.email}</dd>
        </div>
        <div>
          <dt>Pickup · India time</dt>
          <dd>{formatTime(toUTC(period.startsAt))}</dd>
        </div>
        <div>
          <dt>Return · India time</dt>
          <dd>{formatTime(toUTC(period.endsAt))}</dd>
        </div>
      </dl>
      <h3>Selected vehicles</h3>
      <ul>
        {lines.map((line) => (
          <li key={line.key}>
            {line.group?.name} × {line.quantity}
          </li>
        ))}
      </ul>
      <p>Add-ons: none selected.</p>
      <p>Rental Policy accepted for this selection.</p>
      {!quote.ready && (
        <p role="alert">
          Availability or prices have changed. Edit your selection and check again.
        </p>
      )}
      <div className="booking-review__actions">
        <button type="button" className="rr-button--outline" onClick={onEdit}>
          <Pencil size={15} aria-hidden="true" />
          Edit details
        </button>
        {single && quote.ready && (
          <Link className="rr-button" to={checkout}>
            Continue to single-vehicle checkout
          </Link>
        )}
      </div>
      {!single && (
        <div className="booking-review__pending">
          <p>
            Online confirmation for multiple vehicles is not available yet. Contact the shop to
            arrange this selection.
          </p>
          <CallLink className="rr-button" />
          <button type="button" disabled>
            Confirm multi-vehicle booking
          </button>
        </div>
      )}
    </section>
  );
}
