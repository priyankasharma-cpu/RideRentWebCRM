import './RentalInspectionForm.css';
export function RentalInspectionForm({ submitInspection, action, booking, busy }) {
  return (
    <form className="action-form" onSubmit={submitInspection}>
      <h3>{action === 'pickup' ? 'Pickup inspection' : 'Return inspection'}</h3>
      <div className="form-grid">
        <label>
          Odometer (km)
          <input
            type="number"
            name="odometer"
            min={booking.vehicle.odometer}
            defaultValue={booking.vehicle.odometer}
            required
          />
        </label>
        <label>
          Fuel level
          <select name="fuel">
            {['Full', 'Three quarters', 'Half', 'Quarter', 'Empty'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="span-2">
          Vehicle condition
          <input
            name="condition"
            placeholder="Good / scratches / damage details"
            minLength="2"
            required
          />
        </label>
        {action === 'return' && (
          <label className="span-2">
            Additional charges (₹, excluding automatic late fee)
            <input name="additional" type="number" defaultValue="0" min="0" step="0.01" />
          </label>
        )}
        <label className="span-2">
          Inspection notes
          <textarea name="notes" maxLength="2000" />
        </label>
      </div>
      <button className="rr-button" disabled={busy}>
        Save {action === 'pickup' ? 'Pickup' : 'Return'} Inspection
      </button>
    </form>
  );
}
