import { money } from '../../utils/formatters.js';
import './CheckoutVehicles.css';
export function CheckoutTotals({ quote, items = [], catalog, addOnRows = [], error }) {
  const lines =
    quote?.lines ||
    items
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        ...item,
        name:
          catalog?.models.find((model) => model.unitIds.includes(item.vehicleId))?.name ||
          'Selected vehicle',
      }));
  const addOns =
    quote?.addOns ||
    addOnRows
      .filter((row) => row.paidQuantity + row.included > 0)
      .map((row) => ({
        id: row.option.id,
        name: row.option.name,
        quantity: row.paidQuantity + row.included,
      }));
  const amount = (value) => (quote ? money(value) : '—');
  return (
    <div className="checkout-totals" aria-live="polite" aria-busy={!quote && !error}>
      <p className="checkout-totals__note checkout-totals__status" role="status">
        {quote
          ? 'Prices verified for your current selection.'
          : error
            ? 'Quote unavailable. Retry availability before confirming.'
            : lines.length
              ? 'Updating your prices…'
              : 'Select available vehicles and dates to calculate the full total.'}
      </p>
      {lines.map((line) => (
        <div className="checkout-totals__line" key={line.vehicleId}>
          <span>
            {line.name} × {line.quantity}
            <br />
            <small>
              {quote
                ? `${quote.hours} hours × ${money(line.rate)} / vehicle`
                : 'Awaiting the current server quote'}
            </small>
          </span>
          <strong>{amount(line.base)}</strong>
        </div>
      ))}
      {addOns.map((addon) => (
        <div className="checkout-totals__line" key={addon.id}>
          <span>
            {addon.name} × {addon.quantity}
            <br />
            <small>
              {quote
                ? `${addon.includedQuantity} included · ${addon.paidQuantity} extra · ${money(addon.rate)} / unit / ${addon.billing === 'hour' ? 'hour' : 'booking'}`
                : 'Awaiting current add-on charges'}
            </small>
          </span>
          <strong>{amount(addon.base)}</strong>
        </div>
      ))}
      <div className="checkout-totals__line">
        <span>Tax (vehicles and extras)</span>
        <strong>{amount(quote?.tax)}</strong>
      </div>
      <div className="checkout-totals__line">
        <span>Refundable security deposits</span>
        <strong>{amount(quote?.deposit)}</strong>
      </div>
      <div className="checkout-totals__line checkout-totals__grand">
        <span>Total payable at shop</span>
        <strong>{amount(quote?.total)}</strong>
      </div>
      <p className="checkout-totals__note">
        Full total for all selected vehicles and add-ons. Pay at pickup; no online payment is taken.
        Availability and prices are checked again when you confirm.
      </p>
    </div>
  );
}
