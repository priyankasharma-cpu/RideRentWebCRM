import { Fragment, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useFinance } from './financeQueries.js';
import { ExportControl, SelectField } from './FinanceControls.jsx';
import { ExpenseForm, TransactionForm } from './FinanceForms.jsx';
import { FinanceSkeleton } from './FinanceMetrics.jsx';
import {
  count,
  expenseCategories,
  methods,
  money,
  sourceNames,
  statuses,
  types,
  when,
} from './financeModel.js';
import './FinanceLedger.css';

const optionsFor = (list) => Object.fromEntries(list.map((option) => [option, option]));
const sorts = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  highest: 'Highest amount',
  lowest: 'Lowest amount',
};
const transactionHeadings = [
  'Date',
  'Transaction',
  'Booking / Customer',
  'Vehicle / Source',
  'Amount',
  'Method / Status',
  'Actions',
];
const expenseHeadings = [
  'Date',
  'Expense / Category',
  'Vendor',
  'Vehicle',
  'Amount',
  'Method / Status',
  'Actions',
];

function Details({ row, expense, timezone }) {
  const fields = [
    [expense ? 'Expense ID' : 'Transaction ID', row.id],
    ['Booking ID', row.bookingId],
    [
      'Original payment',
      row.type !== 'payment' && row.type !== 'deposit_collection' && row.paymentId,
    ],
    ['Recorded by', row.recordedBy],
    ['Reference', row.reference],
    ['Notes', row.notes],
    ['Reversal of', row.reversalOf],
    ['Reversed on', row.reversedAt && when(row.reversedAt, timezone)],
    ['Adjustment type', row.adjustmentKind?.replaceAll('_', ' ')],
  ];
  return (
    <dl className="finance-row-details">
      {fields
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function LedgerTable({ rows, expense, timezone, onAction, showActions }) {
  const [details, setDetails] = useState('');
  const headings = expense ? expenseHeadings : transactionHeadings;
  return (
    <div
      className="finance-table-scroll"
      tabIndex={0}
      role="region"
      aria-label={expense ? 'Expense records' : 'Finance transactions'}
    >
      <table>
        <thead>
          <tr>
            {headings.map((heading) => (
              <th scope="col" key={heading}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const type =
              row.adjustmentKind === 'cancellation_fee'
                ? 'Cancellation fee'
                : types[row.type] || row.type;
            const view = details === row.id;
            return (
              <Fragment key={row.type + row.id}>
                <tr>
                  <td>
                    {row.localDate || when(row.date, timezone)}
                    {row.reversedAt && <small>Reversed</small>}
                  </td>
                  <td>
                    {expense ? row.title : type}
                    <small>
                      {expense
                        ? row.expenseCategory
                        : row.type === 'expense'
                          ? row.title
                          : row.reference || row.id}
                    </small>
                  </td>
                  <td>
                    {expense ? row.vendor || '—' : row.bookingRef || '—'}
                    {!expense && row.customer && <small>{row.customer}</small>}
                  </td>
                  <td>
                    {row.vehicle || '—'}
                    {!expense && row.source && <small>{sourceNames[row.source]}</small>}
                  </td>
                  <td className="finance-number">{money(row.amount)}</td>
                  <td>
                    {row.method || '—'}
                    <small>{statuses[row.status] || row.status}</small>
                  </td>
                  <td>
                    <div className="finance-row-actions">
                      <button
                        className="rr-button--text"
                        type="button"
                        aria-expanded={view}
                        onClick={() => setDetails(view ? '' : row.id)}
                      >
                        {view ? 'Hide details' : 'Details'}
                      </button>
                      {showActions && expense && !row.reversalOf && (
                        <button
                          className="rr-button--text"
                          type="button"
                          onClick={() => onAction({ mode: 'expense', row })}
                        >
                          Edit
                        </button>
                      )}
                      {showActions && expense && row.reversalOf && (
                        <button
                          className="rr-button--text"
                          type="button"
                          onClick={() => onAction({ mode: 'view-expense', row })}
                        >
                          Audit
                        </button>
                      )}
                      {showActions &&
                        row.status === 'completed' &&
                        ((row.bookingStatus === 'cancelled' && row.type === 'payment') ||
                          (['cancelled', 'completed'].includes(row.bookingStatus) &&
                            row.type === 'deposit_collection')) && (
                          <button
                            className="rr-button--text"
                            type="button"
                            onClick={() => onAction({ mode: 'refund', row })}
                          >
                            {row.type === 'deposit_collection' ? 'Return' : 'Refund'}
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
                {view && (
                  <tr>
                    <td colSpan={headings.length}>
                      <Details row={row} expense={expense} timezone={timezone} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function FinanceLedger({
  filters,
  kind = 'transactions',
  showActions = false,
  maxDate,
  onLoaded,
}) {
  const expense = kind === 'expenses';
  const [controls, setControls] = useState({
    type: '',
    expenseCategory: '',
    method: '',
    status: '',
    sort: 'newest',
    page: 1,
  });
  const [search, setSearch] = useState('');
  const [querySearch, setQuerySearch] = useState('');
  const [action, setAction] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuerySearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const set = (name, value) => setControls((existing) => ({ ...existing, page: 1, [name]: value }));
  const query = { ...filters, ...controls, search: querySearch };
  const request = useFinance('/' + kind, query);
  const data = request.data;
  useEffect(() => {
    if (data) onLoaded?.(data);
  }, [data, onLoaded]);
  const open = (value) => {
    setMessage('');
    setAction(value);
  };
  const saved = () => {
    setAction(null);
    setMessage('Financial record saved.');
  };
  const lastPage = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  return (
    <section className="finance-ledger">
      <div className="finance-card">
        <div className="finance-section-heading">
          <h2>{expense ? 'Expense register' : 'Transaction history'}</h2>
          {showActions && (
            <div className="finance-row-actions">
              <button
                type="button"
                className="rr-button"
                onClick={() => open({ mode: expense ? 'expense' : 'payment' })}
              >
                <Plus size={16} /> {expense ? 'Record expense' : 'Record payment'}
              </button>
              {!expense && (
                <button
                  type="button"
                  className="rr-button--outline"
                  onClick={() => open({ mode: 'adjustment' })}
                >
                  <SlidersHorizontal size={15} /> Record adjustment
                </button>
              )}
            </div>
          )}
        </div>
        {message && (
          <p role="status" className="finance-up">
            {message}
          </p>
        )}
        <div className="finance-table-filters">
          <label>
            <span>
              <Search size={14} aria-hidden="true" /> Search {expense ? 'expenses' : 'transactions'}
            </span>
            <input
              type="search"
              value={search}
              maxLength={100}
              placeholder={
                expense ? 'Expense, vendor, reference…' : 'Booking, customer, reference…'
              }
              onChange={(e) => {
                setSearch(e.target.value);
                set('page', 1);
              }}
            />
          </label>
          <SelectField
            label={expense ? 'Expense category' : 'Transaction type'}
            value={expense ? controls.expenseCategory : controls.type}
            options={expense ? optionsFor(expenseCategories) : types}
            blank="All"
            onChange={(value) => set(expense ? 'expenseCategory' : 'type', value)}
          />
          <SelectField
            label="Payment method"
            value={controls.method}
            options={optionsFor(methods)}
            blank="All methods"
            onChange={(value) => set('method', value)}
          />
          <SelectField
            label="Status"
            value={controls.status}
            options={statuses}
            blank="All statuses"
            onChange={(value) => set('status', value)}
          />
          <SelectField
            label="Sort"
            value={controls.sort}
            options={sorts}
            onChange={(value) => set('sort', value)}
          />
          <ExportControl filters={{ ...query, search: search.trim() }} report={kind} />
        </div>
      </div>
      {action &&
        (expense ? (
          <ExpenseForm
            key={action.mode + (action.row?.id || '')}
            row={action.row}
            readOnly={action.mode === 'view-expense'}
            maxDate={maxDate}
            timezone={data?.timezone}
            cancel={() => setAction(null)}
            onSaved={saved}
          />
        ) : (
          <TransactionForm
            key={action.mode + (action.row?.id || '')}
            mode={action.mode}
            row={action.row}
            maxDate={maxDate}
            cancel={() => setAction(null)}
            onSaved={saved}
          />
        ))}
      <div className="finance-card">
        {request.isPending && <FinanceSkeleton count={2} />}
        {request.isError && (
          <p role="alert" className="finance-error">
            {request.error.message}
          </p>
        )}
        {data &&
          (data.rows.length ? (
            <LedgerTable
              rows={data.rows}
              expense={expense}
              timezone={data.timezone}
              onAction={open}
              showActions={showActions}
            />
          ) : (
            <p className="finance-no-results">
              <ListFilter size={17} /> No matching records.
            </p>
          ))}
        {data && (
          <div className="finance-pagination">
            <span>
              {count(data.total)} records · Page {count(data.page)} of {count(lastPage)}
            </span>
            <div>
              <button
                type="button"
                className="rr-button--outline"
                aria-label="Previous page"
                disabled={data.page <= 1}
                onClick={() => set('page', data.page - 1)}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                type="button"
                className="rr-button--outline"
                aria-label="Next page"
                disabled={data.page >= lastPage}
                onClick={() => set('page', data.page + 1)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
