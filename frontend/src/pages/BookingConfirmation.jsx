import '../components/booking/BookingFacts.css';
import { applyImageFallback } from '../config/imageConfig.js';
import { useBooking } from '../hooks/useBookings';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../hooks/useApp.js';
import { useState, useEffect } from 'react';
import { defaultPeriod, shopInput, toUTC } from '../utils/rentalTime.js';
import { api } from '../services/apiClient.js';
import { Loading } from '../components/common/Loader.jsx';
import { ErrorBox } from '../components/common/ErrorBox.jsx';
import { BookingTimingNotice } from '../components/booking/BookingStatusSummary.jsx';
import { rentalDuration } from '../utils/bookingStatus.js';
import { BookingSuccess } from '../components/booking/BookingSuccess.jsx';
import { formatTime, money } from '../utils/formatters.js';
import { MapPin, ArrowRight } from 'lucide-react';
import { PriceBreakdown } from '../components/booking/PriceBreakdown.jsx';
import { CallLink } from '../components/common/CallLink.jsx';
import { PeriodFields } from '../components/booking/PeriodFields.jsx';
import { paymentLabels } from '../utils/bookingStatus.js';
import './BookingConfirmation.css';
export function BookingConfirmation() {
  const { id } = useParams(),
    { config, notify } = useApp();
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [rescheduling, setRescheduling] = useState(false),
    [period, setPeriod] = useState(defaultPeriod);
  const { booking, fetchError, setBooking } = useBooking(id);
  const scheduledStart = booking?.starts_at,
    scheduledEnd = booking?.ends_at;
  useEffect(() => {
    if (scheduledStart && scheduledEnd)
      setPeriod({ startsAt: shopInput(scheduledStart), endsAt: shopInput(scheduledEnd) });
  }, [scheduledStart, scheduledEnd]);
  const action = async (path, body) => {
    setBusy(true);
    try {
      const b = await api('/bookings/' + id + path, {
        method: 'POST',
        body,
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
              <BookingTimingNotice booking={booking} />
              {booking.checkout?.bookings.length > 1 && (
                <section
                  className="rr-panel confirmation-order"
                  aria-label="Combined checkout summary"
                >
                  <h2>{booking.checkout.bookings.length} vehicles reserved together</h2>
                  <div className="confirmation-order__totals">
                    <strong className="confirmation-order__grand-total">
                      Combined checkout total <span>{money(booking.checkout.totalPayable)}</span>
                    </strong>
                    <span>Paid (after refunds): {money(booking.checkout.amountPaid)}</span>
                    <span>Outstanding: {money(booking.checkout.outstanding)}</span>
                    <span>Security deposits booked: {money(booking.checkout.securityDeposit)}</span>
                    <span>
                      Refundable deposit available: {money(booking.checkout.refundableDeposit)}
                    </span>
                    {booking.checkout.amountRefunded > 0 && (
                      <span>Refunded: {money(booking.checkout.amountRefunded)}</span>
                    )}
                    <span className="confirmation-order__payment-state">
                      {paymentLabels[booking.checkout.paymentState]}
                    </span>
                  </div>
                  <p className="subtle-note">
                    Each vehicle has its own reference, pickup, return and payment record. The
                    selected vehicle’s individual booking total is shown in its summary below.
                  </p>
                  <ul>
                    {booking.checkout.bookings.map((member) => (
                      <li key={member.id} className="confirmation-order__member">
                        <div className="confirmation-order__member-heading">
                          <Link
                            to={'/booking/confirmation/' + member.id}
                            aria-current={member.id === id ? 'page' : undefined}
                          >
                            {member.name} · {member.reference}
                            {member.id === id ? ' · Selected vehicle' : ''}
                          </Link>
                          <span>
                            {member.status} ·{' '}
                            {paymentLabels[member.paymentState] || 'Payment status unavailable'}
                          </span>
                        </div>
                        <div className="confirmation-order__member-finances">
                          <span>Rental: {money(member.rentalCharge)}</span>
                          <span>Tax: {money(member.tax)}</span>
                          <span>Security deposit booked: {money(member.securityDeposit)}</span>
                          <span>Deposit paid: {money(member.depositPaid)}</span>
                          <span>
                            Refundable deposit available: {money(member.refundableDeposit)}
                          </span>
                          <span>Paid after refunds: {money(member.amountPaid)}</span>
                          {member.amountRefunded > 0 && (
                            <span>Refunded: {money(member.amountRefunded)}</span>
                          )}
                          <span>Outstanding: {money(member.outstanding)}</span>
                          <span>Total payable: {money(member.totalPayable)}</span>
                          {member.addOns.map((addon, index) => (
                            <span key={`${member.id}-${addon.name}-${index}`}>
                              {addon.name} × {addon.quantity}: {money(addon.base + addon.tax)}
                              {addon.includedQuantity > 0 &&
                                ` (${addon.includedQuantity} included)`}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
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
                      <strong>{rentalDuration(booking.starts_at, booking.ends_at)}</strong>
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
                  {booking.checkout?.bookings.length > 1 && (
                    <p className="confirmation-order__individual-label">
                      Individual total for {booking.vehicle.name}:{' '}
                      <strong>{money(booking.total)}</strong>
                    </p>
                  )}
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
                    {booking.status === 'confirmed'
                      ? 'Payment is collected at the shop. Bring your original driving license and government ID.'
                      : booking.rentalState === 'returned'
                        ? 'Vehicle return recorded by the shop. Inspection and any deposit refund are tracked separately.'
                        : 'Payment reflects receipts recorded by the shop.'}
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
