import './VehicleFilters.css';
export function VehicleFilters({
  query,
  setQuery,
  category,
  setCategory,
  trans,
  setTrans,
  fuel,
  setFuel,
  max,
  setMax,
  onlyAvailable,
  setOnlyAvailable,
}) {
  return (
    <aside className="filters rr-panel">
      <h3>Make it your ride</h3>
      <label>
        Search by model
        <input
          placeholder="Yamaha, Honda, Toyota…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <label>
        Vehicle category
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {['All', 'Bike', 'Scooter', 'Car'].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Transmission
        <select value={trans} onChange={(e) => setTrans(e.target.value)}>
          {['All', 'Manual', 'Automatic'].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Fuel type
        <select value={fuel} onChange={(e) => setFuel(e.target.value)}>
          {['All', 'Petrol', 'Diesel', 'Electric', 'Hybrid'].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Up to ₹{max}/hour
        <input
          type="range"
          min="50"
          max="1000"
          step="10"
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
        />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={onlyAvailable}
          onChange={(e) => setOnlyAvailable(e.target.checked)}
        />{' '}
        Available only
      </label>
      <button
        className="rr-button--text"
        onClick={() => {
          setQuery('');
          setCategory('All');
          setFuel('All');
          setTrans('All');
          setMax(1000);
          setOnlyAvailable(false);
        }}
      >
        Reset filters
      </button>
    </aside>
  );
}
