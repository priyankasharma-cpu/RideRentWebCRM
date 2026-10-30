import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../services/apiClient.js';
import { saveBookingToken } from '../services/bookingTokens.js';
import { ErrorBox } from '../components/common/ErrorBox.jsx';
import { ArrowRight } from 'lucide-react';
import { CallLink } from '../components/common/CallLink.jsx';
import './MyBookings.css';
export function MyBookings() {
  const navigate = useNavigate(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      const result = await api('/bookings/lookup', {
        method: 'POST',
        body: values,
      });
      saveBookingToken(result.booking.id, result.token);
      navigate('/my-bookings/' + result.booking.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="container page portal-page">
      <div className="eyebrow">YOUR JOURNEY AT A GLANCE</div>
      <h1>
        Find <em>your booking.</em>
      </h1>
      <p>Enter the reference and mobile number used when you booked.</p>
      <form className="rr-panel" onSubmit={submit}>
        <label>
          Booking reference
          <input
            name="reference"
            placeholder="RR-XXXXXXXXXXXX"
            required
            minLength="5"
            maxLength="50"
          />
        </label>
        <label>
          Mobile number
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            placeholder="Your booking phone number"
          />
        </label>
        <ErrorBox>{error}</ErrorBox>
        <button className="rr-button full-width" disabled={busy}>
          {busy ? 'Finding your ride…' : 'Find My Booking'} <ArrowRight size={15} />
        </button>
        <p className="form-note">
          No customer password needed. Only the matching booking is shown.
        </p>
      </form>
      <CallLink className="rr-button--outline">Need help finding your reference?</CallLink>
    </main>
  );
}
