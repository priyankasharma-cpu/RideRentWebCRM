import '../components/booking/BookingLayout.css';
import { useVehicle } from '../hooks/useVehicles';
import { useQuote } from '../hooks/useQuote';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../hooks/useApp.js';
import { useState } from 'react';
import { periodFromParams, toUTC } from '../utils/rentalTime.js';
import { api } from '../services/apiClient.js';
import { saveBookingToken } from '../services/bookingTokens.js';
import { Loading } from '../components/common/Loader.jsx';
import { ErrorBox } from '../components/common/ErrorBox.jsx';
import { BookingForm } from '../components/booking/BookingForm.jsx';
import { BookingSummary } from '../components/booking/BookingSummary.jsx';
import './Checkout.css';
export function Checkout() {
  const [params] = useSearchParams(),
    navigate = useNavigate(),
    { notify } = useApp();
  const { data: v, error: vehicleError, loading } = useVehicle(params.get('vehicle') || 'missing');
  const [period, setPeriod] = useState(() => periodFromParams(params)),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const result = await api('/bookings', {
        method: 'POST',
        body: {
          vehicleId: v.id,
          ...values,
          startsAt: toUTC(period.startsAt),
          endsAt: toUTC(period.endsAt),
          agreement: values.agreement === 'on',
        },
      });
      saveBookingToken(result.booking.id, result.token);
      notify('Booking confirmed. Your ride is reserved.');
      navigate('/booking/confirmation/' + result.booking.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const { quote, quoteError } = useQuote(v?.id, period);
  if (loading) return <Loading />;
  if (vehicleError)
    return (
      <main className="container page">
        <ErrorBox>{vehicleError}</ErrorBox>
        <Link className="rr-button" to="/vehicles">
          Choose a vehicle
        </Link>
      </main>
    );
  return (
    <main className="container page">
      <div className="page-heading">
        <div className="eyebrow">YOUR JOURNEY, ALMOST READY</div>
        <h1>
          Let’s make it <em>official.</em>
        </h1>
        <p>Reserve now. Pay at pickup. Every booking is checked for availability.</p>
      </div>
      <div className="checkout-layout">
        <BookingForm
          submit={submit}
          period={period}
          setPeriod={setPeriod}
          error={error || quoteError}
          quote={quote}
          busy={busy}
        />
        <BookingSummary v={v} quote={quote} />
      </div>
    </main>
  );
}
