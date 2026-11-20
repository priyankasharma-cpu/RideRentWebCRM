import '../components/booking/BookingLayout.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp.js';
import { useEffect, useState } from 'react';
import { toUTC } from '../utils/rentalTime.js';
import { useRentalPeriod } from '../hooks/useRentalPeriod.js';
import { api } from '../services/apiClient.js';
import { ErrorBox } from '../components/common/ErrorBox.jsx';
import { BookingForm } from '../components/booking/BookingForm.jsx';
import { BookingSummary } from '../components/booking/BookingSummary.jsx';
import { CheckoutVehicles } from '../components/booking/CheckoutVehicles.jsx';
import { CheckoutAddOns } from '../components/booking/CheckoutAddOns.jsx';
import { CheckoutTotals } from '../components/booking/CheckoutTotals.jsx';
import { useCheckout } from '../hooks/useCheckout.js';
import './Checkout.css';

export function Checkout() {
  const [params] = useSearchParams();
  return <CheckoutContent key={params.get('vehicle') || 'new'} params={params} />;
}
function CheckoutContent({ params }) {
  const navigate = useNavigate();
  const { notify, user } = useApp();
  const { period, setPeriod } = useRentalPeriod();
  const [items, setItems] = useState(() =>
    params.get('vehicle') ? [{ vehicleId: params.get('vehicle'), quantity: null }] : [],
  );
  const [addOnQuantities, setAddOnQuantities] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const checkout = useCheckout(period, items, addOnQuantities);
  const effectiveAddOns = JSON.stringify(
    Object.fromEntries(checkout.addOns.map((item) => [item.addOnId, item.quantity])),
  );
  useEffect(() => {
    if (checkout.verified && JSON.stringify(addOnQuantities) !== effectiveAddOns)
      setAddOnQuantities(JSON.parse(effectiveAddOns));
  }, [checkout.verified, effectiveAddOns, addOnQuantities]);
  const primary = checkout.catalog?.models.find((model) =>
    model.unitIds.includes(items[0]?.vehicleId),
  );
  const changeItems = (next) => {
    setItems(next);
    setError('');
  };
  const submit = async (event) => {
    event.preventDefault();
    if (busy || !checkout.quote) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = {
      ...values,
      agreement: values.agreement === 'on',
      startsAt: toUTC(period.startsAt),
      endsAt: toUTC(period.endsAt),
      items: checkout.items,
      addOns: checkout.addOns,
      expectedTotal: checkout.quote.total,
      quoteSignature: checkout.quote.signature,
    };
    const signature = JSON.stringify(body);
    const credentials =
      attempt?.signature === signature
        ? attempt
        : {
            signature,
            submissionKey: crypto.randomUUID(),
            reservationToken: (crypto.randomUUID() + crypto.randomUUID()).replaceAll('-', ''),
          };
    setAttempt(credentials);
    setBusy(true);
    setError('');
    try {
      const result = await api('/checkout/reserve', {
        method: 'POST',
        body: {
          ...body,
          submissionKey: credentials.submissionKey,
          reservationToken: credentials.reservationToken,
        },
      });
      notify(
        result.bookings.length > 1
          ? `${result.bookings.length} vehicles reserved together.`
          : 'Booking confirmed. Your ride is reserved.',
      );
      navigate('/booking/confirmation/' + result.bookings[0].booking.id);
    } catch (failure) {
      setError(failure.message);
      checkout.refresh();
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="container page">
      <div className="page-heading">
        <div className="eyebrow">YOUR JOURNEY, ALMOST READY</div>
        <h1>
          Let’s make it <em>official.</em>
        </h1>
        <p>Reserve one or more vehicles. Pay the full total at pickup.</p>
      </div>
      <ErrorBox>{checkout.error}</ErrorBox>
      {checkout.error && checkout.canRetry && (
        <button type="button" className="rr-button--outline" onClick={checkout.refresh}>
          Retry availability
        </button>
      )}
      <div className="checkout-layout">
        <BookingForm
          submit={submit}
          period={period}
          setPeriod={setPeriod}
          error={error}
          quote={checkout.quote}
          busy={busy}
          selection={
            <>
              <CheckoutVehicles
                catalog={checkout.catalog}
                items={checkout.displayRows}
                verified={checkout.verified}
                availabilityError={Boolean(checkout.error)}
                onItems={changeItems}
                busy={busy}
              />
              <CheckoutAddOns
                rows={checkout.addOnRows}
                verified={checkout.verified}
                busy={busy}
                onChange={setAddOnQuantities}
                isAdmin={user?.role === 'admin'}
                helmetConfigured={Boolean(checkout.catalog?.helmets?.enabled)}
              />
            </>
          }
        />
        {primary ? (
          <BookingSummary v={primary}>
            <CheckoutTotals
              quote={checkout.quote}
              items={checkout.displayRows}
              catalog={checkout.catalog}
              addOnRows={checkout.addOnRows}
              error={checkout.error}
            />
          </BookingSummary>
        ) : (
          <aside className="rr-panel checkout-summary">
            <h2>Your rental summary</h2>
            <CheckoutTotals
              quote={checkout.quote}
              items={checkout.displayRows}
              catalog={checkout.catalog}
              addOnRows={checkout.addOnRows}
              error={checkout.error}
            />
          </aside>
        )}
      </div>
    </main>
  );
}
