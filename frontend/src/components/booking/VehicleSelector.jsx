import { useState } from 'react';
import { CarFront, Search } from 'lucide-react';
import { bookingConfig } from '../../config/bookingConfig.js';
import { applyImageFallback } from '../../config/imageConfig.js';
import { money } from '../../utils/formatters.js';
import { QuantityControl } from './QuantityControl.jsx';
import { Loading } from '../common/Loader.jsx';
import { ErrorBox } from '../common/ErrorBox.jsx';
import './VehicleSelector.css';
export function VehicleSelector({ groups, lines, loading, error, disabled, onQuantity }) {
  const [category, setCategory] = useState('All'),
    [query, setQuery] = useState('');
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const visible = groups.filter(
    (group) =>
      (category === 'All' || group.category === category) &&
      group.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <section
      className="group-booking__panel vehicle-selector"
      aria-labelledby="vehicle-selector-title"
    >
      <h2 id="vehicle-selector-title">
        <CarFront size={21} aria-hidden="true" />
        02 · Choose your rides
      </h2>
      <p>
        Choose distinct available vehicles. Quantities reflect actual inventory for your selected
        dates.
      </p>
      <div className="vehicle-selector__filters">
        <div role="group" aria-label="Vehicle categories">
          {bookingConfig.categories.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <label>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search vehicles for booking"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vehicles"
          />
        </label>
      </div>
      <ErrorBox>{error}</ErrorBox>
      {loading ? (
        <Loading />
      ) : (
        <div className="vehicle-selector__grid">
          {visible.map((group) => {
            const quantity = lines
              .filter((line) => line.group?.key === group.key)
              .reduce((sum, line) => sum + line.quantity, 0);
            const max = Math.min(
              group.availableUnits.length,
              quantity + bookingConfig.maxVehiclesPerCart - count,
            );
            return (
              <article
                className="vehicle-selector__vehicle"
                key={group.key}
                aria-label={group.name}
              >
                <img
                  src={group.image}
                  alt={group.name}
                  loading="lazy"
                  decoding="async"
                  onError={applyImageFallback}
                />
                <div className="vehicle-selector__vehicle-copy">
                  <span>{group.category}</span>
                  <h3>{group.name}</h3>
                  <p>
                    {money(group.minimumRate)}
                    <small> / hour{group.units.length > 1 ? ' · from' : ''}</small>
                  </p>
                  <span className="vehicle-selector__stock">
                    {group.availableUnits.length} available
                  </span>
                </div>
                <QuantityControl
                  name={group.name}
                  quantity={quantity}
                  max={max}
                  disabled={disabled}
                  onChange={(value) => onQuantity(group, value)}
                />
              </article>
            );
          })}
        </div>
      )}
      {!loading && !error && !visible.length && (
        <p className="vehicle-selector__empty">
          No vehicles match your search. Try another category or model.
        </p>
      )}
    </section>
  );
}
