import '../components/booking/BookingFacts.css';
import { applyImageFallback } from '../config/imageConfig.js';
import { useBooking } from '../hooks/useBookings';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../hooks/useApp.js';
import { useState, useEffect } from 'react';
import { defaultPeriod, shopInput, toUTC } from '../utils/rentalTime.js';
import { bookingToken } from '../services/bookingTokens.js';
import { api } from '../services/apiClient.js';
import { Loading } from '../components/common/Loader.jsx';
import { ErrorBox } from '../components/common/ErrorBox.jsx';
import { BookingSuccess } from '../components/booking/BookingSuccess.jsx';
import { formatTime, money } from '../utils/formatters.js';
import { MapPin, ArrowRight } from 'lucide-react';
import { PriceBreakdown } from '../components/booking/PriceBreakdown.jsx';
import { CallLink } from '../components/common/CallLink.jsx';
import { PeriodFields } from '../components/booking/PeriodFields.jsx';
import './BookingConfirmation.css';
export function BookingConfirmation() {
  const { id } = useParams(),
    { config, notify } = useApp();
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [rescheduling, setRescheduling] = useState(false),
    [period, setPeriod] = useState(defaultPeriod);
  const token = bookingToken(id);
  const { booking, fetchError, setBooking } = useBooking(id, token);
  useEffect(() => {
    if (booking)
      setPeriod({
        startsAt: shopInput(booking.starts_at),
        endsAt: shopInput(booking.ends_at),
      });
  }, [booking]);
  const action = async (path, body) => {
    setBusy(true);
    try {
      const b = await api('/bookings/' + id + path, {
        method: 'POST',
        body,
        token,
      });
      setBooking(b);
      setRescheduling(false);
      notify('Booking updated.');
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="container page confirmation-page">
      {!booking && !(error || fetchError) ? (
        <Loading />
      ) : (
        <>
          <ErrorBox>{error || fetchError}</ErrorBox>
          {booking ? (
            <>
              <BookingSuccess booking={booking} />
              <div className="booking-summary-layout">
                <div className="rr-panel">
                  <img
                    className="booking-cover"
                    src={booking.vehicle.image}
                    alt={booking.vehicle.name}
                    onError={applyImageFallback}
                    decoding="async"
                  />
                  <h2>{booking.vehicle.name}</h2>
                  <div className="booking-facts">
                    <div>
                      <small>Pickup · India time</small>
                      <strong>{formatTime(booking.starts_at)}</strong>
                    </div>
                    <div>
                      <small>Return · India time</small>
                      <strong>{formatTime(booking.ends_at)}</strong>
                    </div>
                    <div>
                      <small>Booked for</small>
                      <strong>{booking.customer.name}</strong>
                    </div>
                    <div>
                      <small>Rental period</small>
                      <strong>{booking.hours} hours</strong>
                    </div>
                    {booking.rental && (
                      <>
                        <div>
                          <small>Actual pickup</small>
                          <strong>{formatTime(booking.rental.pickup_at)}</strong>
                        </div>
                        <div>
                          <small>Actual return</small>
                          <strong>{formatTime(booking.rental.return_at)}</strong>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="subtle-note">
                    <MapPin size={16} />
                    {config?.address}
                  </p>
                </div>
                <div className="rr-panel">
                  <h3>Your rental summary</h3>
                  <PriceBreakdown
                    quote={{
                      ...booking,
                      base: booking.status === 'cancelled' ? 0 : booking.base,
                      tax: booking.status === 'cancelled' ? 0 : booking.tax,
                      extra: booking.status === 'cancelled' ? 0 : booking.extra,
                      deposit: ['completed', 'cancelled'].includes(booking.status)
                        ? 0
                        : booking.deposit,
                      total: booking.total,
                      roundingMinutes: config?.roundingMinutes || 60,
                    }}
                  />
                  {booking.refundableDeposit > 0 && (
                    <p className="subtle-note">
                      Deposit available for shop refund: {money(booking.refundableDeposit)}
                    </p>
                  )}
                  <p className="payment-state">
                    Paid: {money(booking.rentalPaid + booking.depositPaid)} · Outstanding:{' '}
                    <strong>{money(booking.outstanding)}</strong>
                  </p>
                  <p className="subtle-note">
                    Pay at shop · Bring your original driving license and government ID.
                  </p>
                  <CallLink className="rr-button full-width" />
                  {booking.status === 'confirmed' && (
                    <div className="booking-manage">
                      <button
                        className="rr-button--outline"
                        disabled={busy}
                        onClick={() => setRescheduling(!rescheduling)}
                      >
                        Reschedule
                      </button>
                      <button
                        className="rr-button--danger"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              'Cancel this reservation? Any paid amounts will be handled by the shop.',
                            )
                          )
                            action('/cancel');
                        }}
                      >
                        Cancel Booking
                      </button>
                      {rescheduling && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            action('/reschedule', {
                              startsAt: toUTC(period.startsAt),
                              endsAt: toUTC(period.endsAt),
                            });
                          }}
                        >
                          <PeriodFields value={period} onChange={setPeriod} />
                          <button className="rr-button" disabled={busy}>
                            Save New Dates
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Link className="back-link" to="/vehicles">
                Explore more rides <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <Link className="rr-button" to="/my-bookings">
              Find your booking
            </Link>
          )}
        </>
      )}
    </main>
  );
}
