import './RentalCompletionForm.css';
export function RentalCompletionForm({ update, busy }) {
  return (
    <form
      className="action-form"
      onSubmit={(e) => {
        e.preventDefault();
        update('/complete', {
          roadReady: e.currentTarget.ready.checked,
        });
      }}
    >
      <h3>Final inspection</h3>
      <p className="subtle-note">
        Close after charges are settled. Deposit refund is recorded separately.
      </p>
      <label className="checkbox-label">
        <input type="checkbox" name="ready" defaultChecked /> Vehicle is road-ready. Uncheck to send
        it to maintenance.
      </label>
      <button className="rr-button" disabled={busy}>
        Close Rental
      </button>
    </form>
  );
}
