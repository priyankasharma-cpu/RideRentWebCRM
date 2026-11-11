import { CalendarClock, RefreshCw } from 'lucide-react';
import { PeriodFields } from './PeriodFields.jsx';
import { ErrorBox } from '../common/ErrorBox.jsx';
import './RentalSchedule.css';
export function RentalSchedule({ cart, loading }) {
  return (
    <section
      className="group-booking__panel rental-schedule"
      aria-labelledby="rental-schedule-title"
    >
      <h2 id="rental-schedule-title">
        <CalendarClock size={21} aria-hidden="true" />
        01 · Plan your rental
      </h2>
      <p>One pickup and return schedule for every vehicle. All times are India time (IST).</p>
      <form onSubmit={cart.applySchedule} aria-label="Rental schedule">
        <PeriodFields value={cart.period} onChange={cart.setPeriod} />
        <button className="rr-button" disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" />
          {loading ? 'Checking…' : 'Check availability'}
        </button>
      </form>
      {cart.changed && (
        <p className="rental-schedule__notice" role="status">
          Apply your updated dates to check availability and prices.
        </p>
      )}
      <ErrorBox>{cart.scheduleError}</ErrorBox>
    </section>
  );
}
