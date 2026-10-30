import './AvailabilitySearch.css';
import './PeriodFields.css';
export function PeriodFields({ value, onChange }) {
  return (
    <div className="period-fields">
      <label>
        Pickup · India time
        <input
          aria-label="Pickup date and time"
          type="datetime-local"
          value={value.startsAt}
          min={new Date(Date.now() + 19800000).toISOString().slice(0, 16)}
          onChange={(e) =>
            onChange({
              ...value,
              startsAt: e.target.value,
            })
          }
          required
        />
      </label>
      <label>
        Return · India time
        <input
          aria-label="Return date and time"
          type="datetime-local"
          value={value.endsAt}
          min={value.startsAt}
          onChange={(e) =>
            onChange({
              ...value,
              endsAt: e.target.value,
            })
          }
          required
        />
      </label>
    </div>
  );
}
