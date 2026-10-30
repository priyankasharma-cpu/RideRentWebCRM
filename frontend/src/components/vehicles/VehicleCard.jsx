import { applyImageFallback } from '../../config/imageConfig.js';
import { useSavedVehicles } from '../../hooks/useSavedVehicles';
import { Link } from 'react-router-dom';
import { Heart, Fuel, Gauge, Users, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Status } from '../common/StatusBadge.jsx';
import { money } from '../../utils/formatters.js';
import './VehicleCard.css';
export function VehicleCard({ vehicle: v, period }) {
  const { saved: storedIds, toggleSaved } = useSavedVehicles();
  const saved = storedIds.includes(v.id);
  const toggle = () => toggleSaved(v.id);
  const params = new URLSearchParams({
    vehicle: v.id,
    ...period,
  });
  const unavailable =
    v.available === false ||
    (!period &&
      ['Maintenance', 'Inactive', 'Rented', 'Overdue', 'Inspection'].includes(v.physicalStatus));
  return (
    <article className="vehicle-card">
      <div className="vehicle-image">
        <Link to={'/vehicles/' + v.slug}>
          <img
            src={v.image}
            alt={v.name + ' — illustrative image'}
            loading="lazy"
            onError={applyImageFallback}
            decoding="async"
          />
        </Link>
        <span className="vehicle-tag">{v.category}</span>
        <button
          className={'favorite ' + (saved ? 'saved' : '')}
          onClick={toggle}
          aria-label={(saved ? 'Unsave ' : 'Save ') + v.name}
        >
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="vehicle-info">
        <Link to={'/vehicles/' + v.slug}>
          <h3>{v.name}</h3>
        </Link>
        <div className="specs">
          <span>
            <Fuel />
            {v.fuel}
          </span>
          <span>
            <Gauge />
            {v.transmission}
          </span>
          <span>
            <Users />
            {v.seats} seats
          </span>
        </div>
        <div className="vehicle-availability">
          <Status
            value={
              unavailable
                ? v.physicalStatus === 'Available'
                  ? 'Reserved'
                  : v.physicalStatus
                : 'Available'
            }
          />
        </div>
        <div className="vehicle-bottom">
          <p>
            {money(v.rate)}
            <span> / hour</span>
          </p>
          <Link
            className="rr-button"
            to={unavailable ? '/vehicles/' + v.slug : '/checkout?' + params}
          >
            {unavailable ? 'View Details' : 'Book Now'} <ArrowRight size={12} />
          </Link>
        </div>
        <Link className="vehicle-detail-link" to={'/vehicles/' + v.slug}>
          View specifications <ArrowUpRight size={12} />
        </Link>
      </div>
    </article>
  );
}
