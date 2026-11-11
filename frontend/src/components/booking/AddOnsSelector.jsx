import { ShieldCheck } from 'lucide-react';
import { bookingConfig } from '../../config/bookingConfig.js';
import { QuantityControl } from './QuantityControl.jsx';
import './AddOnsSelector.css';
export function AddOnsSelector({ categories }) {
  return (
    <section className="group-booking__panel add-ons-selector" aria-labelledby="add-ons-title">
      <h2 id="add-ons-title">
        <ShieldCheck size={21} aria-hidden="true" />
        03 · Add-ons
      </h2>
      {bookingConfig.addOns.map((addOn) => {
        const eligible = categories.some((category) => addOn.categories.includes(category));
        return (
          <div className="add-ons-selector__option" key={addOn.id}>
            <div>
              <h3>{addOn.name}</h3>
              <p>
                {eligible
                  ? addOn.description
                  : 'Helmets apply to bikes and scooters. Select a two-wheeler to view this option.'}
              </p>
              <span>
                {eligible
                  ? 'Price and included quantities must be confirmed with the shop.'
                  : categories.length
                    ? 'Not applicable to car-only bookings.'
                    : 'Select vehicles first.'}
              </span>
            </div>
            <QuantityControl name={addOn.name} quantity={0} max={0} disabled onChange={() => {}} />
          </div>
        );
      })}
    </section>
  );
}
