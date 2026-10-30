import { applyImageFallback } from '../../config/imageConfig.js';
import { PriceBreakdown } from './PriceBreakdown.jsx';
import { CallLink } from '../common/CallLink.jsx';
import './BookingSummary.css';
export function BookingSummary({ v, quote }) {
  return (
    <aside className="rr-panel checkout-summary">
      <img src={v.image} alt={v.name} onError={applyImageFallback} decoding="async" />
      <span className="eyebrow">{v.category}</span>
      <h2>{v.name}</h2>
      {quote ? (
        <PriceBreakdown quote={quote} />
      ) : (
        <p className="subtle-note">Calculating your rental…</p>
      )}
      <CallLink className="rr-button--outline full-width">Need a hand? Call us</CallLink>
    </aside>
  );
}
