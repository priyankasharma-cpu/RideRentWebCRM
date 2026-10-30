import { homeContent } from '../../config/homeContent';
import { useHomePage } from '../../context/HomePageContext.jsx';
import { CarFront, Bike, ArrowRight, ShieldCheck } from 'lucide-react';
import './BookingSearch.css';
export function BookingSearch() {
  const {
    search,
    category,
    setCategory,
    today,
    date,
    setDate,
    returnDate,
    setReturnDate,
    pickup,
    setPickup,
    dropoff,
    setDropoff,
    error,
  } = useHomePage();
  return (
    <form className="booking-search" onSubmit={search}>
      <div className="category-tabs">
        {['Bike', 'Scooter', 'Car'].map((c) => (
          <button
            type="button"
            key={c}
            className={category === c ? 'selected' : ''}
            onClick={() => setCategory(c)}
          >
            {c === 'Car' ? <CarFront size={20} /> : <Bike size={20} />} {c}
          </button>
        ))}
      </div>
      <div className="date-grid">
        <label>
          Pickup Date
          <input
            aria-label="Pickup date"
            type="date"
            min={today}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (returnDate < e.target.value) setReturnDate(e.target.value);
            }}
            required
          />
        </label>
        <label>
          Pickup Time
          <input
            aria-label="Pickup time"
            type="time"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            required
          />
        </label>
        <label>
          Return Date
          <input
            aria-label="Return date"
            type="date"
            min={date}
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            required
          />
        </label>
        <label>
          Return Time
          <input
            aria-label="Return time"
            type="time"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            required
          />
        </label>
      </div>
      {error && <p className="rr-error-text">{error}</p>}
      <button className="rr-button search-button">
        {' '}
        {homeContent.booking.cta} <ArrowRight size={16} />
      </button>
      <div className="search-note">
        <ShieldCheck size={12} /> {homeContent.booking.note}{' '}
      </div>
    </form>
  );
}
