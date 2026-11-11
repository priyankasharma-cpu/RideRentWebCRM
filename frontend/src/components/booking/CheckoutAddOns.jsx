import { Package, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QuantityControl } from './QuantityControl.jsx';
import { CallLink } from '../common/CallLink.jsx';
import { stepBoundedQuantity } from '../../utils/checkoutSelections.js';
import { money } from '../../utils/formatters.js';
import './CheckoutAddOns.css';

export function CheckoutAddOns({ rows, verified, busy, onChange, isAdmin, helmetConfigured }) {
  return (
    <section className="checkout-addons" aria-label="Helmets and add-ons">
      <h3>Helmets & Add-ons</h3>
      <p className="checkout-addons__note">
        Included items are free and reserve stock. Choose paid extras below.
      </p>
      {!verified && (
        <p role="status" className="checkout-addons__note">
          Checking add-on availability for your dates…
        </p>
      )}
      {rows.map(({ option, included, maximum, paidQuantity }) => (
        <div
          key={option.id}
          className={
            'checkout-addons__row' + (option.code === 'helmet' ? ' checkout-vehicles__helmet' : '')
          }
        >
          <div className="checkout-addons__information">
            <strong>
              {option.code === 'helmet' ? (
                <ShieldCheck size={16} aria-hidden="true" />
              ) : (
                <Package size={16} aria-hidden="true" />
              )}
              {option.name}
            </strong>
            {option.description && <p>{option.description}</p>}
            <small>
              {money(option.rate)} / unit / {option.billing === 'hour' ? 'hour' : 'booking'} ·{' '}
              {included} included · {option.maxQuantity} total maximum per checkout
            </small>
            <small>
              {verified
                ? `${option.available} available for these dates · up to ${maximum} paid extras`
                : 'Availability must be verified before adding extras.'}
            </small>
            {verified && included > Math.min(option.available, option.maxQuantity) && (
              <small role="alert">
                Not enough capacity for the included items. Change vehicles or dates, or contact the
                shop.
              </small>
            )}
            {verified && paidQuantity >= maximum && (
              <small>
                {maximum === 0
                  ? 'No paid extras available for this selection.'
                  : `Maximum ${maximum} paid extras reached.`}
              </small>
            )}
          </div>
          <QuantityControl
            name={option.code === 'helmet' ? 'Extra helmets' : option.name}
            quantity={paidQuantity}
            max={verified ? maximum : paidQuantity}
            disabled={busy}
            increaseDisabled={!verified}
            limitMessage="Available stock or checkout maximum reached, including free items."
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                [option.id]: stepBoundedQuantity(
                  current[option.id] || 0,
                  value - paidQuantity,
                  verified ? maximum : paidQuantity,
                ),
              }))
            }
          />
        </div>
      ))}
      {verified && !rows.length && (
        <p className="checkout-addons__note">No enabled add-ons match your selected vehicles.</p>
      )}
      {verified && !helmetConfigured && (
        <p className="checkout-addons__note checkout-vehicles__helmet">
          Extra helmets are currently unavailable.{' '}
          {isAdmin ? (
            <Link to="/admin/addons" target="_blank" rel="noopener noreferrer">
              Configure Helmets in Admin →
            </Link>
          ) : (
            <CallLink>Ask the shop about helmets</CallLink>
          )}
        </p>
      )}
    </section>
  );
}
