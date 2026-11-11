import { Minus, Plus } from 'lucide-react';
import './QuantityControl.css';
export function QuantityControl({
  name,
  quantity,
  max,
  onChange,
  disabled = false,
  increaseDisabled = false,
  limitMessage,
}) {
  return (
    <div className="booking-quantity" role="group" aria-label={`${name} quantity`}>
      <button
        type="button"
        aria-label={`Decrease ${name} quantity`}
        disabled={disabled || quantity === 0}
        onClick={() => onChange(quantity - 1)}
      >
        <Minus size={15} aria-hidden="true" />
      </button>
      <output aria-live="polite" aria-label={`${name} selected quantity`}>
        {quantity}
      </output>
      <button
        type="button"
        aria-label={`Increase ${name} quantity`}
        disabled={disabled || increaseDisabled || quantity >= max}
        title={
          increaseDisabled || quantity >= max
            ? limitMessage || 'Available quantity limit reached'
            : `Add one ${name}`
        }
        onClick={() => onChange(quantity + 1)}
      >
        <Plus size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
