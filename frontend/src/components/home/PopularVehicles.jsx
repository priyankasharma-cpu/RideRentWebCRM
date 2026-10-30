import { homeContent } from '../../config/homeContent';
import { useHomePage } from '../../context/HomePageContext.jsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ErrorBox } from '../common/ErrorBox.jsx';
import { Loading } from '../common/Loader.jsx';
import { VehicleCard } from '../vehicles/VehicleCard.jsx';
import './PopularVehicles.css';
export function PopularVehicles() {
  const { setOffset, offset, visible, setFilter, filter, saved, fleetError, loading, ordered } =
    useHomePage();
  return (
    <section className="container section popular-section" id="popular">
      <div className="section-heading">
        <div>
          <div className="eyebrow">{homeContent.popular.eyebrow}</div>
          <h2>
            {' '}
            {homeContent.popular.titleLead} <em>{homeContent.popular.titleAccent}</em>
          </h2>
        </div>
        <div className="carousel-controls">
          <button
            aria-label="Previous vehicles"
            onClick={() => setOffset(offset + Math.max(visible.length - 1, 0))}
          >
            <ChevronLeft size={19} />
          </button>
          <button aria-label="Next vehicles" onClick={() => setOffset(offset + 1)}>
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
      <div className="filter-tabs">
        {['All', 'Bike', 'Scooter', 'Car', 'Saved'].map((c) => (
          <button
            key={c}
            onClick={() => {
              setFilter(c);
              setOffset(0);
            }}
            className={filter === c ? 'selected' : ''}
          >
            {c === 'All' ? 'All vehicles' : c === 'Saved' ? `Saved (${saved.length})` : c + 's'}
          </button>
        ))}
        <span>
          <span className="tiny-dot" /> {homeContent.popular.readyLabel}{' '}
        </span>
      </div>
      <ErrorBox>{fleetError}</ErrorBox>
      {loading ? (
        <Loading />
      ) : (
        <div className="vehicle-grid">
          {ordered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
      {!loading && !ordered.length && <p className="empty-state">{homeContent.popular.empty}</p>}
    </section>
  );
}
