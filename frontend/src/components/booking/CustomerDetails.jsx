import { Link } from 'react-router-dom';
import { UserRound, ArrowRight } from 'lucide-react';
import { ErrorBox } from '../common/ErrorBox.jsx';
import './CustomerDetails.css';
export function CustomerDetails({ customer, onChange, onReview, canReview, error }) {
  const change = (event) =>
    onChange({
      ...customer,
      [event.target.name]:
        event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    });
  return (
    <section
      className="group-booking__panel booking-customer"
      aria-labelledby="booking-customer-title"
    >
      <h2 id="booking-customer-title">
        <UserRound size={21} aria-hidden="true" />
        04 · Your details
      </h2>
      <p>
        No password is needed to plan your booking. These details do not sign you into an account.
      </p>
      <form onSubmit={onReview} aria-label="Booking customer details">
        <div className="booking-customer__fields">
          <label>
            Full name
            <input
              name="name"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
              value={customer.name}
              onChange={change}
              placeholder="Name of the main renter"
            />
          </label>
          <label>
            Mobile number
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={20}
              required
              pattern={String.raw`[+0-9 \(\)\-]{10,20}`}
              value={customer.phone}
              onChange={change}
              placeholder="Your contact number"
            />
          </label>
          <label className="booking-customer__email">
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={150}
              required
              value={customer.email}
              onChange={change}
              placeholder="you@example.com"
            />
          </label>
        </div>
        <label className="booking-customer__agreement">
          <input
            type="checkbox"
            name="agreement"
            checked={customer.agreement}
            onChange={change}
            required
          />
          <span>
            I am 18+, have the appropriate valid Driving Licence, and accept the{' '}
            <Link to="/rental-policy" target="_blank" rel="noopener noreferrer">
              Rental Policy
            </Link>
            .
          </span>
        </label>
        <ErrorBox>{error}</ErrorBox>
        <button className="rr-button" disabled={!canReview}>
          Review selection
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        {!canReview && (
          <p className="booking-customer__hint">
            Select available rides and apply your dates to continue.
          </p>
        )}
      </form>
    </section>
  );
}
