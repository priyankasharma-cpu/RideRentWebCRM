import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { bookingService } from '../services/bookingService.js';
import { ErrorBox } from '../components/common/ErrorBox.jsx';
import { CallLink } from '../components/common/CallLink.jsx';
import './MyBookings.css';

export function MyBookings() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState(null);

  const requestCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const result = await bookingService.requestAccessCode(values);
      setChallenge({ id: result.challengeId, reference: values.reference, email: values.email });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const result = await bookingService.verifyAccessCode({
        challengeId: challenge.id,
        code: values.code,
      });
      navigate('/my-bookings/' + result.bookingId);
    } catch (failure) {
      setError(failure.message);
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
      <p>Verify the email used for your booking to securely view its details.</p>
      {!challenge ? (
        <form className="rr-panel" onSubmit={requestCode}>
          <label>
            Booking reference
            <input
              name="reference"
              placeholder="RR-XXXXXXXXXXXX"
              required
              minLength="5"
              maxLength="50"
              autoComplete="off"
            />
          </label>
          <label>
            Booking email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength="150"
              placeholder="Email used when you booked"
            />
          </label>
          <ErrorBox>{error}</ErrorBox>
          <button className="rr-button full-width" disabled={busy}>
            {busy ? 'Sending verification…' : 'Send verification code'} <Mail size={16} />
          </button>
          <p className="form-note">
            <ShieldCheck size={14} /> We use a one-time email code. Booking reference and email
            alone never unlock booking details.
          </p>
        </form>
      ) : (
        <form className="rr-panel" onSubmit={verifyCode}>
          <p role="status" className="form-note">
            If those details match a booking, a code may arrive at the saved email. Enter it within
            10 minutes. If no code arrives, request another or contact the shop.
          </p>
          <label>
            Six-digit verification code
            <input
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength="6"
              maxLength="6"
              required
              autoFocus
            />
          </label>
          <ErrorBox>{error}</ErrorBox>
          <button className="rr-button full-width" disabled={busy}>
            {busy ? 'Verifying…' : 'Verify and find booking'} <ArrowRight size={15} />
          </button>
          <button
            className="rr-button--outline full-width"
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const result = await bookingService.requestAccessCode({
                  reference: challenge.reference,
                  email: challenge.email,
                });
                setChallenge({ ...challenge, id: result.challengeId });
              } catch (failure) {
                setError(failure.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Resend code
          </button>
          <button
            className="rr-button--outline full-width"
            type="button"
            disabled={busy}
            onClick={() => {
              setChallenge(null);
              setError('');
            }}
          >
            Change reference or email
          </button>
        </form>
      )}
      <CallLink className="rr-button--outline">Need help finding your reference?</CallLink>
    </main>
  );
}
