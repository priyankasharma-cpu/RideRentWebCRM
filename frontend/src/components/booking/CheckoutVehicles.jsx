import { Bike, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { stepCheckoutSelection, removeCheckoutSelection } from '../../utils/checkoutSelections.js';
import { QuantityControl } from './QuantityControl.jsx';
import { money } from '../../utils/formatters.js';
import './CheckoutVehicles.css';

export function CheckoutVehicles({ catalog, items, onItems, busy, verified, availabilityError }) {
  const [choice, setChoice] = useState('');
  const models = catalog?.models || [];
  const selected = items.map((item) => ({
    ...item,
    model: models.find((model) => model.unitIds.includes(item.vehicleId)),
  }));
  const remaining = models.filter(
    (model) =>
      verified && model.available > 0 && !selected.some((item) => item.model?.key === model.key),
  );
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <section className="checkout-vehicles" aria-label="Selected vehicles">
      <p className="checkout-vehicles__intro">
        <Bike size={17} aria-hidden="true" /> Add vehicles for your group. All use the dates above.
      </p>
      <div className="checkout-vehicles__list">
        {selected.map((item) => (
          <div className="checkout-vehicles__row" key={item.vehicleId}>
            <div className="checkout-vehicles__name">
              <strong>{item.model?.name || 'Selected vehicle'}</strong>
              <small>
                {!verified
                  ? availabilityError
                    ? 'Availability could not be verified. Retry the check.'
                    : 'Checking available stock…'
                  : item.model
                    ? `${money(item.model.rate)} / hour · ${item.model.available > 0 ? item.model.available + ' available' : 'Currently Unavailable · 0 available'}`
                    : 'Selected vehicle is no longer available.'}
              </small>
              {verified &&
                item.model?.available > 0 &&
                item.quantity >= Math.min(item.model.available, 50 - quantity + item.quantity) && (
                  <small className="checkout-vehicles__limit">
                    {quantity >= 50
                      ? 'Checkout request limit reached. Contact the shop for a larger group.'
                      : item.model.available === 1
                        ? 'Only 1 physical vehicle is available for these dates.'
                        : `All ${item.model.available} available physical vehicles are selected.`}
                  </small>
                )}
            </div>
            <QuantityControl
              name={item.model?.name || 'Vehicle'}
              quantity={item.quantity}
              max={
                verified
                  ? Math.min(item.model?.available || 0, 50 - quantity + item.quantity)
                  : item.quantity
              }
              onChange={(value) =>
                onItems((current) =>
                  stepCheckoutSelection(
                    current,
                    item.vehicleId,
                    value - item.quantity,
                    verified
                      ? Math.min(item.model?.available || 0, 50 - quantity + item.quantity)
                      : item.quantity,
                    item.quantity,
                  ),
                )
              }
              disabled={busy}
              increaseDisabled={!verified || !item.model}
              limitMessage={
                !verified
                  ? 'Availability must be verified before adding a vehicle.'
                  : 'All available vehicles or the checkout limit are already selected.'
              }
            />
            <button
              type="button"
              className="checkout-vehicles__remove"
              aria-label={`Remove ${item.model?.name || 'vehicle'}`}
              disabled={busy}
              onClick={() => onItems((current) => removeCheckoutSelection(current, item.vehicleId))}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <div className="checkout-vehicles__add">
        <label htmlFor="checkout-add-vehicle" className="sr-only">
          Choose another vehicle
        </label>
        <select
          id="checkout-add-vehicle"
          value={choice}
          onChange={(event) => setChoice(event.target.value)}
          disabled={busy || !verified || !remaining.length || quantity >= 50}
        >
          <option value="">
            {!verified
              ? availabilityError
                ? 'Retry availability to choose vehicles'
                : 'Checking available vehicles…'
              : remaining.length
                ? 'Choose another vehicle'
                : 'No other vehicles available'}
          </option>
          {remaining.map((model) => (
            <option key={model.key} value={model.vehicleId}>
              {model.name} · {money(model.rate)} / hour ({model.available} available)
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rr-button--outline"
          disabled={
            busy ||
            !verified ||
            !remaining.some((model) => model.vehicleId === choice) ||
            quantity >= 50
          }
          onClick={() => {
            onItems((current) =>
              current.some((item) => item.vehicleId === choice)
                ? current
                : [...current, { vehicleId: choice, quantity: 1 }],
            );
            setChoice('');
          }}
        >
          <Plus size={16} aria-hidden="true" /> Add
        </button>
      </div>
      <p className="checkout-vehicles__note">
        Each quantity reserves a different physical vehicle of the same model. Quantity is limited
        to available stock. Decreasing a quantity to zero removes only that vehicle from your cart.
      </p>
    </section>
  );
}
