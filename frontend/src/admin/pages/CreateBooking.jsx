import '../../components/booking/BookingForm.css';
import '../../components/booking/BookingSummary.css';
import '../../components/booking/BookingLayout.css';
import { useQuote } from '../../hooks/useQuote';
import { useResource } from '../../hooks/useResource.js';
import { useState } from 'react';
import { defaultPeriod, toUTC } from '../../utils/rentalTime.js';
import { useAdminAction } from '../hooks/useAdminAction.js';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient.js';
import { PageTitle } from '../components/PageTitle.jsx';
import { money } from '../../utils/formatters.js';
import { PeriodFields } from '../../components/booking/PeriodFields.jsx';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { Check, ShieldCheck } from 'lucide-react';
import { Status } from '../../components/common/StatusBadge.jsx';
import { PriceBreakdown } from '../../components/booking/PriceBreakdown.jsx';
import './CreateBooking.css';
export function CreateBooking() {
  const { data: vehicles, error: vehicleError } = useResource('/admin/vehicles');
  const { data: customers } = useResource('/admin/customers');
  const [vehicleId, setVehicleId] = useState(''),
    [period, setPeriod] = useState(defaultPeriod),
    [customerId, setCustomerId] = useState(''),
    [name, setName] = useState(''),
    [phone, setPhone] = useState(''),
    [email, setEmail] = useState(''),
    [verified, setVerified] = useState(false);
  const { error, busy, execute } = useAdminAction();
  const navigate = useNavigate();
  const selectCustomer = (id) => {
    setCustomerId(id);
    const c = customers?.find((c) => c.id === id);
    setName(c?.name || '');
    setPhone(c?.phone || '');
    setEmail(c?.email || '');
    setVerified(!!c?.verified);
  };
  const submit = async (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const result = await execute(
      () =>
        api('/admin/bookings', {
          method: 'POST',
          body: {
            ...values,
            vehicleId,
            name,
            phone,
            email,
            verified,
            agreement: true,
            startsAt: toUTC(period.startsAt),
            endsAt: toUTC(period.endsAt),
          },
        }),
      'Booking confirmed and saved.',
    );
    if (result) navigate('/admin/bookings');
  };
  const { quote, quoteError } = useQuote(vehicleId, period);
  return (
    <>
      <PageTitle
        title="A new journey starts with you."
        subtitle="Create a phone or walk-in booking using the same live availability engine."
      />
      <div className="checkout-layout admin-checkout">
        <form className="rr-panel checkout-form" onSubmit={submit}>
          <h3>01 · Customer details</h3>
          <label>
            Existing or new customer
            <select value={customerId} onChange={(e) => selectCustomer(e.target.value)}>
              <option value="">New customer</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.phone}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength="2"
              />
            </label>
            <label>
              Mobile number
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                pattern="[+0-9 ()-]{10,18}"
              />
            </label>
            <label className="span-2">
              Email (optional)
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
            />{' '}
            Original driving license verified by staff
          </label>
          <h3>02 · Choose a ride</h3>
          <label>
            Specific vehicle
            <select required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">Select a vehicle</option>
              {vehicles
                ?.filter((v) => v.status !== 'Inactive')
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · {v.registration} · {money(v.rate)}/hr · {v.physicalStatus}
                  </option>
                ))}
            </select>
          </label>
          <PeriodFields value={period} onChange={setPeriod} />
          <h3>03 · Booking details</h3>
          <div className="form-grid">
            <label>
              Booking source
              <select name="source">
                <option>Phone</option>
                <option>Walk-in</option>
                <option>Website</option>
              </select>
            </label>
            <label>
              Payment option
              <input value="Pay at shop · unpaid" readOnly />
            </label>
            <label className="span-2">
              Notes
              <textarea
                name="notes"
                maxLength="2000"
                placeholder="Pickup arrangements or customer requests"
              />
            </label>
          </div>
          <ErrorBox>{error || quoteError || vehicleError}</ErrorBox>
          <button className="rr-button" disabled={busy || !quote?.available}>
            {busy ? 'Creating booking…' : 'Confirm Booking'} <Check size={16} />
          </button>
        </form>
        <aside className="rr-panel checkout-summary">
          <div className="eyebrow">RENTAL ESTIMATE</div>
          <h2>
            A clear price.
            <br />
            <em>A confident booking.</em>
          </h2>
          {quote ? (
            <>
              <div className="quote-availability">
                <Status value={quote.available ? 'Available' : 'Unavailable'} />
                <p>{quote.reason}</p>
              </div>
              <PriceBreakdown quote={quote} />
            </>
          ) : (
            <p className="subtle-note">
              Choose a vehicle and rental time to check availability and calculate charges.
            </p>
          )}
          <p className="subtle-note">
            <ShieldCheck size={16} /> Availability is checked again when you confirm. Payment status
            stays separate from rental status.
          </p>
        </aside>
      </div>
    </>
  );
}
