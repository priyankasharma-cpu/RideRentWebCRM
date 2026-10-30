import { useVehicles } from '../hooks/useVehicles';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { periodFromParams, toUTC } from '../utils/rentalTime.js';
import { PeriodFields } from '../components/booking/PeriodFields.jsx';
import { ArrowRight, Bike } from 'lucide-react';
import { ErrorBox } from '../components/common/ErrorBox.jsx';
import { VehicleFilters } from '../components/vehicles/VehicleFilters.jsx';
import { Loading } from '../components/common/Loader.jsx';
import { VehicleCard } from '../components/vehicles/VehicleCard.jsx';
import './Vehicles.css';
export function Vehicles() {
  const [params, setParams] = useSearchParams();
  const [period, setPeriod] = useState(() => periodFromParams(params));
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState(params.get('category') || 'All'),
    [sort, setSort] = useState('recommended'),
    [fuel, setFuel] = useState('All'),
    [trans, setTrans] = useState('All'),
    [max, setMax] = useState(1000),
    [onlyAvailable, setOnlyAvailable] = useState(false),
    [searchError, setSearchError] = useState('');
  const [window, setWindow] = useState('');
  const { data, error, loading } = useVehicles(window);
  const search = (e) => {
    e.preventDefault();
    try {
      if (new Date(toUTC(period.endsAt)) <= new Date(toUTC(period.startsAt)))
        throw Error('Return time must be after pickup.');
      const q = new URLSearchParams({
        startsAt: toUTC(period.startsAt),
        endsAt: toUTC(period.endsAt),
      });
      setWindow('?' + q);
      setSearchError('');
      setOnlyAvailable(true);
      setParams({
        ...period,
        category,
      });
    } catch (e) {
      setSearchError(e.message);
    }
  };
  useEffect(() => {
    if (params.get('startsAt')) {
      try {
        setWindow(
          '?' +
            new URLSearchParams({
              startsAt: toUTC(params.get('startsAt')),
              endsAt: toUTC(params.get('endsAt')),
            }),
        );
        setOnlyAvailable(true);
      } catch {
        setSearchError('Invalid date range.');
      }
    }
  }, [params]);
  const vehicles = (data || [])
    .filter(
      (v) =>
        (category === 'All' || v.category === category) &&
        v.name.toLowerCase().includes(query.toLowerCase()) &&
        (fuel === 'All' || v.fuel === fuel) &&
        (trans === 'All' || v.transmission === trans) &&
        v.rate <= max * 100 &&
        (!onlyAvailable || (window ? v.available : v.physicalStatus === 'Available')),
    )
    .sort((a, b) =>
      sort === 'low'
        ? a.rate - b.rate
        : sort === 'high'
          ? b.rate - a.rate
          : a.name.localeCompare(b.name),
    );
  return (
    <main className="container page">
      <div className="page-heading">
        <div className="eyebrow">FIND YOUR NEXT ADVENTURE</div>
        <h1>
          One fleet. <em>Endless possibilities.</em>
        </h1>
        <p>Pick your dates to see real availability. All rates are per hour.</p>
      </div>
      <form className="availability-search rr-panel" onSubmit={search}>
        <PeriodFields value={period} onChange={setPeriod} />
        <button className="rr-button">
          Check Availability <ArrowRight size={16} />
        </button>
      </form>
      <ErrorBox>{searchError || error}</ErrorBox>
      <div className="listing-layout">
        <VehicleFilters
          query={query}
          setQuery={setQuery}
          category={category}
          setCategory={setCategory}
          trans={trans}
          setTrans={setTrans}
          fuel={fuel}
          setFuel={setFuel}
          max={max}
          setMax={setMax}
          onlyAvailable={onlyAvailable}
          setOnlyAvailable={setOnlyAvailable}
        />
        <section>
          <div className="results-bar">
            <span>{vehicles.length} rides to choose from</span>
            <select
              aria-label="Sort vehicles"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recommended">Recommended</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </div>
          {loading ? (
            <Loading />
          ) : (
            <div className="vehicle-grid listing-grid">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} period={window ? period : undefined} />
              ))}
            </div>
          )}
          {!loading && !vehicles.length && (
            <div className="empty-state">
              <Bike size={35} />
              <h3>No matching rides just yet.</h3>
              <p>Try another category, date range, or price filter.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
