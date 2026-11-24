import { useRef, useState } from 'react';
import { money } from '../../../utils/formatters.js';
import { paise } from '../../finance/financeModel.js';
import './PaymentForm.css';
export function PaymentForm({ booking: b, busy, onSubmit }) {
  const [purpose, setPurpose] = useState('rental');
  const receipt = useRef(null);
  const due =
    purpose === 'rental'
      ? b.rentalTotal - b.rentalPaid
      : (b.status === 'completed' ? 0 : b.deposit) - b.depositPaid;
  return (
    <form
      className="action-form"
      onSubmit={(e) => {
        e.preventDefault();
        const values = Object.fromEntries(new FormData(e.currentTarget));
        const input = e.currentTarget.elements.amount;
        try {
          const amount = paise(values.amount);
          const fingerprint = JSON.stringify({ bookingId: b.id, ...values, amount });
          if (receipt.current?.fingerprint !== fingerprint) {
            receipt.current = { fingerprint, submissionKey: crypto.randomUUID() };
          }
          onSubmit({ ...values, amount, submissionKey: receipt.current.submissionKey });
        } catch (error) {
          input.setCustomValidity(error.message);
          input.reportValidity();
        }
      }}
    >
      <h3>Record a shop receipt</h3>
      <p className="subtle-note">
        Record money received at the shop. This form does not process a payment.
      </p>
      <div className="form-grid">
        <label>
          Payment purpose
          <select name="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            <option value="rental">Rental charges</option>
            <option value="deposit">Security deposit</option>
          </select>
        </label>
        <label>
          Method
          <select name="method">
            <option>Cash</option>
            <option>UPI</option>
            <option>Card</option>
            <option>Online</option>
            <option>Bank transfer</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          Amount (₹) · due {money(due)}
          <input
            key={purpose + due}
            name="amount"
            onInput={(e) => e.currentTarget.setCustomValidity('')}
            type="number"
            min="0.01"
            max={Math.max(0, due) / 100}
            step="0.01"
            defaultValue={Math.max(0, due) / 100}
            required
          />
        </label>
        <label>
          Receipt reference
          <input name="reference" maxLength="120" placeholder="Optional transaction reference" />
        </label>
        <label>
          Receipt notes
          <input name="note" maxLength="300" placeholder="Optional reference / receipt" />
        </label>
      </div>
      <button className="rr-button" disabled={busy || due <= 0}>
        Record Receipt
      </button>
    </form>
  );
}
