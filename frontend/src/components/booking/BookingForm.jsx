import { PeriodFields } from './PeriodFields.jsx';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { ErrorBox } from '../common/ErrorBox.jsx';
import './BookingForm.css';
export function BookingForm({ submit, period, setPeriod, error, quote, busy }) {
  return (
    <form className="rr-panel checkout-form" onSubmit={submit}>
      <h3>01 · Your rental time</h3>
      <PeriodFields value={period} onChange={setPeriod} />
      <h3>02 · A little about you</h3>
      <div className="form-grid">
        <label>
          Full name
          <input
            name="name"
            minLength="2"
            maxLength="100"
            autoComplete="name"
            placeholder="As on your driving license"
            required
          />
        </label>
        <label>
          Mobile number
          <input
            name="phone"
            type="tel"
            pattern="[+0-9 ()-]{10,18}"
            autoComplete="tel"
            placeholder="Your mobile number"
            required
          />
        </label>
        <label className="span-2">
          Email (optional)
          <input name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        </label>
      </div>
      <label className="checkbox-label">
        <input type="checkbox" name="agreement" required /> I am 18+, have a valid driving license,
        and accept the{' '}
        <Link to="/terms" target="_blank">
          rental terms
        </Link>
        .
      </label>
      <p className="subtle-note">
        <ShieldCheck size={16} /> License verification is completed by staff before pickup.
      </p>
      <ErrorBox>{error}</ErrorBox>
      {quote && !quote.available && (
        <ErrorBox>{quote.reason}. Please choose another period or vehicle.</ErrorBox>
      )}
      <button disabled={busy || !quote?.available} className="rr-button search-button">
        {busy ? 'Reserving your ride…' : 'Confirm Booking · Pay at Shop'} <ArrowRight size={16} />
      </button>
      <p className="form-note">
        No money is charged online. Your reservation will be saved to our database.
      </p>
    </form>
  );
}
