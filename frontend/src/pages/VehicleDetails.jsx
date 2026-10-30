import { useVehicle } from '../hooks/useVehicles';
import { useQuote } from '../hooks/useQuote';
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { defaultPeriod } from '../utils/rentalTime.js';
import { useApp } from '../hooks/useApp.js';
import { Loading } from '../components/common/Loader.jsx';
import { ErrorBox } from '../components/common/ErrorBox.jsx';
import { VehicleGallery } from '../components/vehicles/VehicleGallery.jsx';
import { Status } from '../components/common/StatusBadge.jsx';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { money } from '../utils/formatters.js';
import { PeriodFields } from '../components/booking/PeriodFields.jsx';
import { PriceBreakdown } from '../components/booking/PriceBreakdown.jsx';
import { CallLink } from '../components/common/CallLink.jsx';
import './VehicleDetails.css';
export function VehicleDetails() {
  const { slug } = useParams(),
    { data: v, error, loading } = useVehicle(slug);
  const [period, setPeriod] = useState(defaultPeriod);
  const { config } = useApp();
  const { quote, quoteError } = useQuote(v?.id, period);
  if (loading) return <Loading />;
  if (error)
    return (
      <main className="container page">
        <ErrorBox>{error}</ErrorBox>
        <Link to="/vehicles">Back to vehicles</Link>
      </main>
    );
  return (
    <main className="container page">
      <Link className="back-link" to="/vehicles">
        ← All vehicles
      </Link>
      <div className="detail-layout">
        <section>
          <VehicleGallery v={v} />
          <div className="eyebrow">
            {v.brand} · {v.category}
          </div>
          <h1>{v.name}</h1>
          <Status value={v.physicalStatus} />
          <p className="detail-description">{v.description}</p>
          <div className="spec-grid">
            {[
              ['Fuel', v.fuel],
              ['Transmission', v.transmission],
              ['Engine', v.engine],
              ['Seats', v.seats],
              ['Registration', v.registration],
              ['Odometer', v.odometer + ' km'],
            ].map(([k, value]) => (
              <div key={k}>
                <small>{k}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="rr-panel terms-panel">
            <h3>Good to know before you go</h3>
            <p>{config?.fuelPolicy}</p>
            <p>{config?.distancePolicy}</p>
            <p>
              18+ with a valid driving license and government ID. Your license is checked in person
              before pickup. The refundable deposit is returned after inspection and settlement.
            </p>
            <Link to="/rental-policy">
              Read our rental policy <ArrowUpRight size={13} />
            </Link>
          </div>
        </section>
        <aside className="rr-panel detail-book">
          <div className="eyebrow">YOUR NEXT JOURNEY</div>
          <div className="detail-rate">
            {money(v.rate)} <span>/ hour</span>
          </div>
          <p>Refundable deposit: {money(v.deposit)}</p>
          <PeriodFields value={period} onChange={setPeriod} />
          <ErrorBox>{quoteError}</ErrorBox>
          {quote && (
            <>
              <Status value={quote.available ? 'Available' : 'Unavailable'} />
              {!quote.available && <p className="rr-error-text">{quote.reason}</p>}
              <PriceBreakdown quote={quote} />
            </>
          )}
          <Link
            className={'rr-button search-button ' + (!quote?.available ? 'disabled' : '')}
            aria-disabled={!quote?.available}
            onClick={(e) => !quote?.available && e.preventDefault()}
            to={
              '/checkout?' +
              new URLSearchParams({
                vehicle: v.id,
                ...period,
              })
            }
          >
            Book This Ride <ArrowRight size={16} />
          </Link>
          <CallLink className="rr-button--outline full-width">Call to Book</CallLink>
          <p className="form-note">Pay at the shop. No online payment collected.</p>
        </aside>
      </div>
    </main>
  );
}
