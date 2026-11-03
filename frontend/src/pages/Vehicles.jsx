import { ArrowRight, Bike } from 'lucide-react';
import { useVehicles } from '../hooks/useVehicles.js';
import { useVehicleListing } from '../hooks/useVehicleListing.js';
import { filterVehicles, sortVehicles, activeVehicleFilters } from '../utils/vehicleFilters.js';
import { defaultVehicleFilters } from '../config/vehicleFilterConfig.js';
import { PeriodFields } from '../components/booking/PeriodFields.jsx';
import { ErrorBox } from '../components/common/ErrorBox.jsx';
import { Loading } from '../components/common/Loader.jsx';
import { VehicleFilters } from '../components/vehicles/VehicleFilters.jsx';
import { VehicleToolbar } from '../components/vehicles/VehicleToolbar.jsx';
import { VehicleCard } from '../components/vehicles/VehicleCard.jsx';
import './Vehicles.css';

export function Vehicles() {
  const listing = useVehicleListing();
  const { data, error, loading } = useVehicles(listing.apiQuery);
  const vehicles = sortVehicles(
    filterVehicles(data || [], listing.filters, Boolean(listing.appliedPeriod)),
    listing.sort,
  );
  return (
    <main className="container page vehicles-page">
      <div className="page-heading vehicles-page__heading">
        <div className="eyebrow">FIND YOUR NEXT ADVENTURE</div>
        <h1>
          One fleet. <em>Endless possibilities.</em>
        </h1>
        <p>
          A ride for your plans. Pick your dates to check availability, then find your perfect
          match.
        </p>
      </div>
      <form
        className="availability-search rr-panel"
        onSubmit={listing.search}
        aria-label="Check vehicle availability"
      >
        <PeriodFields value={listing.period} onChange={listing.setPeriod} />
        <button className="rr-button">
          Check Availability <ArrowRight size={16} aria-hidden="true" />
        </button>
      </form>
      <ErrorBox>{listing.searchError || error}</ErrorBox>
      <div className="listing-layout">
        <VehicleFilters
          filters={listing.filters}
          onChange={listing.updateFilter}
          onReset={listing.resetFilters}
        />
        <section
          className="vehicles-page__results"
          aria-label="Vehicle results"
          aria-busy={loading}
        >
          <VehicleToolbar
            count={vehicles.length}
            loading={loading}
            sort={listing.sort}
            onSort={listing.setSort}
            chips={activeVehicleFilters(listing.filters)}
            onRemove={(key) => listing.updateFilter(key, defaultVehicleFilters[key])}
            onReset={listing.resetFilters}
            hasRentalPeriod={Boolean(listing.appliedPeriod)}
          />
          {loading ? (
            <Loading />
          ) : (
            <div className="vehicle-grid listing-grid">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} period={listing.appliedPeriod} />
              ))}
            </div>
          )}
          {!loading && !error && !vehicles.length && (
            <div className="empty-state">
              <Bike size={35} aria-hidden="true" />
              <h3>No matching rides just yet.</h3>
              <p>Try another category, date range, or price filter.</p>
              <button
                type="button"
                className="rr-button vehicles-page__empty-reset"
                onClick={listing.resetFilters}
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
