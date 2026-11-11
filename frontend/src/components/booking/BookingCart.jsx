import { ShoppingBag, Trash2 } from 'lucide-react';
import { bookingConfig } from '../../config/bookingConfig.js';
import { QuantityControl } from './QuantityControl.jsx';
import './BookingCart.css';
export function BookingCart({ lines, onQuantity, onRemove, disabled }) {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <section className="booking-cart" aria-labelledby="booking-cart-title">
      <h2 id="booking-cart-title">
        <ShoppingBag size={20} aria-hidden="true" />
        Your selection <span>{count}</span>
      </h2>
      {!lines.length && (
        <p className="booking-cart__empty">Add your first ride to start planning.</p>
      )}
      <ul>
        {lines.map((line) => (
          <li key={line.key}>
            <div className="booking-cart__line-heading">
              <h3>{line.group?.name || 'Vehicle no longer available'}</h3>
              <button
                type="button"
                aria-label={`Remove ${line.group?.name || 'vehicle'} from cart`}
                onClick={() => onRemove(line.key)}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
            {line.group && (
              <QuantityControl
                name={line.group.name}
                quantity={line.quantity}
                max={Math.min(
                  line.group.availableUnits.length,
                  line.quantity + bookingConfig.maxVehiclesPerCart - count,
                )}
                onChange={(value) => onQuantity(line.group, value)}
                disabled={disabled}
              />
            )}
            {!line.available && !disabled && (
              <p className="booking-cart__unavailable" role="status">
                This quantity is not available for your dates. Reduce it or choose another ride.
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
