import {
  Banknote,
  CircleHelp,
  Coins,
  CreditCard,
  Globe,
  Hourglass,
  ReceiptText,
  Store,
  TrendingDown,
  TrendingUp,
  Wallet,
  ShoppingBag,
  Scale,
  CornerUpLeft,
} from 'lucide-react';
import { money, percent, count } from './financeModel.js';
import './FinanceMetrics.css';

const metrics = {
  revenue: [
    'Total combined revenue',
    Wallet,
    'Earned rental and add-on charges, less discounts, plus recognized adjustments. Tax and refundable deposits are excluded.',
  ],
  website: [
    'Website booking revenue',
    Globe,
    'Recognized revenue from bookings classified as website.',
  ],
  walk_in: [
    'Walk-in booking revenue',
    Store,
    'Recognized revenue from bookings explicitly classified as walk-in.',
  ],
  unknown: [
    'Unclassified revenue',
    CircleHelp,
    'Recognized revenue from bookings with another or unverified historical source.',
  ],
  grossBooking: [
    'Gross booking value',
    ShoppingBag,
    'Rental invoice value including taxes, before discounts and excluding deposits, for non-cancelled bookings scheduled to start in this period.',
  ],
  payments: [
    'Total payments received',
    CreditCard,
    'Completed rental receipts on payment dates. Security deposits are tracked separately.',
  ],
  outstanding: [
    'Outstanding payments',
    Hourglass,
    'Unpaid rental invoice balance for non-cancelled bookings scheduled to start in the period. Uses completed payments and refunds through the period end.',
  ],
  refunds: [
    'Total refunds',
    CornerUpLeft,
    'Completed rental refunds on refund dates. Deposit returns are tracked separately.',
  ],
  netCollections: [
    'Net collections',
    Coins,
    'Completed rental receipts less completed rental refunds.',
  ],
  expenses: [
    'Total expenses',
    ReceiptText,
    'Settled operating expenses on their effective dates. Source filters exclude shared expenses.',
  ],
  profit: [
    'Net operating profit',
    Scale,
    'Recognized revenue less settled operating expenses. A source or category filter can exclude shared shop costs.',
  ],
  average: [
    'Average booking value',
    Banknote,
    'Recognized revenue divided by revenue-generating orders, rounded to the nearest paise.',
  ],
  bookings: [
    'Revenue-generating bookings',
    ShoppingBag,
    'Orders with a positive completed rental charge or net cancellation fee. Each checkout is counted once per period.',
  ],
  depositsCollected: [
    'Security deposits collected',
    Banknote,
    'Completed refundable deposit receipts within the period.',
  ],
  depositsReturned: [
    'Security deposits returned',
    CornerUpLeft,
    'Completed deposit returns within the period.',
  ],
  depositsHeld: [
    'Refundable deposits held',
    Banknote,
    'Cumulative completed deposit receipts less deposit returns through period end.',
  ],
  depositsNet: [
    'Net security deposit movement',
    Coins,
    'Deposit collections less deposit returns within the period.',
  ],
};
export const mainMetrics = [
  'revenue',
  'website',
  'walk_in',
  'grossBooking',
  'payments',
  'outstanding',
  'refunds',
  'netCollections',
  'expenses',
  'profit',
  'average',
  'bookings',
];
export const sourceMetrics = [
  'revenue',
  'payments',
  'bookings',
  'outstanding',
  'refunds',
  'average',
];

export function FinanceSkeleton({ count: size = 4 }) {
  return (
    <div className="finance-metric-grid" role="status" aria-label="Loading finance data">
      {Array.from({ length: size }, (_, index) => (
        <div className="finance-skeleton" key={index} />
      ))}
    </div>
  );
}

export default function FinanceMetrics({ keys, data }) {
  return (
    <div className="finance-metric-grid">
      {keys.map((key) => {
        const [label, Icon, definition] = metrics[key];
        const change = data.changes[key];
        const Trend = change >= 0 ? TrendingUp : TrendingDown;
        const lowerIsBetter = ['outstanding', 'refunds', 'expenses'].includes(key);
        const display = key === 'bookings' ? count : money;
        const favorable = lowerIsBetter ? change < 0 : change > 0;
        return (
          <article className="finance-card finance-metric" key={key}>
            <header>
              <Icon size={18} aria-hidden="true" />
              <h3>
                {key === 'revenue' && data.filters?.source ? 'Total recognized revenue' : label}
              </h3>
              <button type="button" className="finance-help" aria-label={definition}>
                <CircleHelp size={15} />
                <span role="tooltip">{definition}</span>
              </button>
            </header>
            <strong>{display(data.current[key])}</strong>
            <div className="finance-comparison">
              {change == null ? (
                <span>
                  {data.current[key]
                    ? 'No prior baseline'
                    : 'Previous period: ' + display(data.previous[key])}
                </span>
              ) : (
                <span className={change === 0 ? '' : favorable ? 'finance-up' : 'finance-down'}>
                  <Trend size={14} aria-hidden="true" /> {change > 0 ? '+' : ''}
                  {percent(change)} vs prior period
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
