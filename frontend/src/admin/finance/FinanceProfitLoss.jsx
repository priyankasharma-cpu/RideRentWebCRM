import { money, percent } from './financeModel.js';
import './FinanceProfitLoss.css';

const lines = [
  [
    'grossRental',
    'Gross rental revenue',
    'Completed rental, add-on and extra charges before discounts and tax.',
  ],
  ['discounts', 'Discounts', 'Explicit discounts on completed rental charges.'],
  [
    'adjustments',
    'Revenue adjustments',
    'Signed accounting entries, including recognized cancellation fees.',
  ],
  [
    'revenue',
    'Net recognized revenue',
    'Gross rental revenue less discounts plus revenue adjustments.',
  ],
  ['expenses', 'Operating expenses', 'Settled expenses less dated expense reversals.'],
  ['profit', 'Net operating profit', 'Net recognized revenue less settled operating expenses.'],
  ['margin', 'Operating profit margin', 'Operating profit divided by positive recognized revenue.'],
];
export default function FinanceProfitLoss({ data }) {
  return (
    <section className="finance-card finance-pnl">
      <h2>Operating statement</h2>
      <p>
        Rental revenue is recognized on service completion. Collections, refunds, and security
        deposits are tracked in the transaction ledger.
      </p>
      <div
        className="finance-table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Operating statement"
      >
        <table>
          <thead>
            <tr>
              <th scope="col">Account</th>
              <th scope="col">Current period</th>
              <th scope="col">Previous period</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(([key, label, definition]) => {
              const format = key === 'margin' ? percent : money;
              const change =
                key === 'margin' && data.current.margin != null && data.previous.margin != null
                  ? (data.current.margin - data.previous.margin).toFixed(1) + ' pp'
                  : key === 'margin'
                    ? '—'
                    : percent(data.changes[key]);
              return (
                <tr
                  key={key}
                  className={['revenue', 'profit'].includes(key) ? 'finance-pnl-total' : ''}
                >
                  <th scope="row">
                    {label}
                    <small>{definition}</small>
                  </th>
                  <td className="finance-number">{format(data.current[key])}</td>
                  <td className="finance-number">{format(data.previous[key])}</td>
                  <td className="finance-number">{change}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
