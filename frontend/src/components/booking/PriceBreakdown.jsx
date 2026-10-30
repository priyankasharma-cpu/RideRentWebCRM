import { money } from '../../utils/formatters.js';
import './PriceBreakdown.css';
export function PriceBreakdown({ quote: q }) {
  return (
    <div className="price-breakdown">
      <div>
        <span>
          {q.hours} hours × {money(q.rate)}
        </span>
        <strong>{money(q.base)}</strong>
      </div>
      <div>
        <span>Tax</span>
        <strong>{money(q.tax)}</strong>
      </div>
      <div>
        <span>Refundable security deposit</span>
        <strong>{money(q.deposit)}</strong>
      </div>
      {q.extra > 0 && (
        <div>
          <span>Additional / late charges</span>
          <strong>{money(q.extra)}</strong>
        </div>
      )}
      <div className="total">
        <span>Total payable at shop</span>
        <strong>{money(q.total)}</strong>
      </div>
      <p>
        Duration rounds up to the next {q.roundingMinutes}-minute block. Fuel is excluded. Late fees
        may apply after the grace period.
      </p>
    </div>
  );
}
