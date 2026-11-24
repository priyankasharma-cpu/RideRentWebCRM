import { useRef, useState } from 'react';
import { useFinance, useFinanceMutation } from './financeQueries.js';
import { expenseCategories, methods, money, paise, when } from './financeModel.js';
import { useResource } from '../../hooks/useResource.js';
import './FinanceForms.css';

function useSubmit(onSaved) {
  const mutation = useFinanceMutation();
  const [error, setError] = useState('');
  const request = useRef(null);
  async function submit(event, build) {
    event.preventDefault();
    setError('');
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const { path, body, method } = build(values);
      const fingerprint = JSON.stringify({ path, body });
      if (method !== 'PATCH') {
        if (request.current?.fingerprint !== fingerprint) {
          request.current = { fingerprint, key: crypto.randomUUID() };
        }
        body.submissionKey = request.current.key;
      }
      await mutation.mutateAsync({ path, body, method });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }
  return { submit, error, busy: mutation.isPending };
}

function MethodField({ value }) {
  return (
    <label>
      <span>Payment method</span>
      <select name="method" defaultValue={value}>
        {methods.map((method) => (
          <option key={method}>{method}</option>
        ))}
      </select>
    </label>
  );
}

function FormActions({ cancel, busy, error, label }) {
  return (
    <div className="finance-form-actions">
      <button type="submit" className="rr-button" disabled={busy}>
        {busy ? 'Saving…' : label}
      </button>
      <button type="button" className="rr-button--outline" onClick={cancel} disabled={busy}>
        Close
      </button>
      {error && (
        <span role="alert" className="finance-error">
          {error}
        </span>
      )}
    </div>
  );
}

function ExpenseHistory({ row, timezone }) {
  const [open, setOpen] = useState(false);
  const history = useFinance('/expenses/' + row.id + '/history', {}, open);
  const historyLabel = (action) =>
    ({
      'finance.expense.created': 'Expense recorded',
      'finance.expense.updated': 'Expense updated',
      'finance.expense.reversed': 'Expense reversed',
    })[action] || action;
  return (
    <div className="finance-audit">
      <button
        type="button"
        className="rr-button--text"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? 'Hide audit history' : 'View audit history'}
      </button>
      {open &&
        (history.isPending ? (
          <p role="status">Loading history…</p>
        ) : history.isError ? (
          <p role="alert">{history.error.message}</p>
        ) : (
          <ul>
            {history.data.rows.map((event, index) => (
              <li key={event.date + index}>
                <details>
                  <summary>
                    {historyLabel(event.action)} · {when(event.date, timezone)} ·{' '}
                    {event.recordedBy || 'System'}
                  </summary>
                  <pre>{JSON.stringify(JSON.parse(event.details), null, 2)}</pre>
                </details>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}

export function ExpenseForm({ row, onSaved, cancel, timezone, maxDate, readOnly = false }) {
  const { submit, error, busy } = useSubmit(onSaved);
  const vehicles = useResource('/admin/vehicles', 0, !readOnly);
  const [reversing, setReversing] = useState(false);
  const settled = row?.status === 'completed';
  const locked = settled || row?.status === 'voided' || Boolean(row?.reversedAt);
  const defaultDate = row?.localDate || maxDate;
  if (readOnly)
    return (
      <section className="finance-card">
        <h3>{row.title}</h3>
        <ExpenseHistory row={row} timezone={timezone} />
        <button className="rr-button--outline" type="button" onClick={cancel}>
          Close
        </button>
      </section>
    );
  return (
    <section className="finance-card">
      <h3>{row ? (reversing ? 'Reverse expense' : 'Edit expense') : 'Record expense'}</h3>
      {reversing ? (
        <form
          className="finance-form"
          onSubmit={(event) =>
            submit(event, (values) => ({
              path: '/expenses/' + row.id + '/reverse',
              body: { ...values, version: row.version },
            }))
          }
        >
          <label>
            <span>Reversal date</span>
            <input
              type="date"
              name="date"
              defaultValue={maxDate}
              min={row.localDate}
              max={maxDate}
              required
            />
          </label>
          <label>
            <span>Reason</span>
            <textarea name="notes" minLength={3} maxLength={1000} required />
          </label>
          <FormActions
            cancel={() => setReversing(false)}
            busy={busy}
            error={error}
            label="Record reversal"
          />
        </form>
      ) : (
        <form
          className="finance-form"
          onSubmit={(event) =>
            submit(event, (values) => ({
              path: row ? '/expenses/' + row.id : '/expenses',
              method: row ? 'PATCH' : 'POST',
              body: {
                ...values,
                ...(locked
                  ? {
                      amount: row.amount,
                      category: row.expenseCategory,
                      date: row.localDate,
                      method: row.method,
                      vehicleId: row.vehicleId || null,
                      status: row.status,
                    }
                  : { amount: paise(values.amount), vehicleId: values.vehicleId || null }),
                ...(row ? { version: row.version } : {}),
              },
            }))
          }
        >
          <label>
            <span>Expense title</span>
            <input name="title" defaultValue={row?.title} maxLength={150} required />
          </label>
          <label>
            <span>Vendor</span>
            <input name="vendor" defaultValue={row?.vendor} maxLength={150} />
          </label>
          <fieldset className="finance-form-accounting" disabled={locked}>
            <label>
              <span>Category</span>
              <select name="category" defaultValue={row?.expenseCategory}>
                {expenseCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Amount (INR)</span>
              <input
                name="amount"
                inputMode="decimal"
                defaultValue={row ? (row.amount / 100).toFixed(2) : ''}
                required
              />
            </label>
            <label>
              <span>Expense date</span>
              <input type="date" name="date" defaultValue={defaultDate} max={maxDate} required />
            </label>
            <MethodField value={row?.method} />
            <label>
              <span>Vehicle (optional)</span>
              <select name="vehicleId" defaultValue={row?.vehicleId || ''}>
                <option value="">Shared shop expense</option>
                {row?.vehicleId &&
                  !vehicles.data?.some((vehicle) => vehicle.id === row.vehicleId) && (
                    <option value={row.vehicleId}>{row.vehicle || row.vehicleId}</option>
                  )}
                {vehicles.data?.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} · {vehicle.registration}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Payment status</span>
              <select name="status" defaultValue={row?.status || 'completed'}>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                {row && <option value="voided">Voided</option>}
              </select>
            </label>
          </fieldset>
          {vehicles.error && <small role="alert">Vehicle list unavailable. {vehicles.error}</small>}
          <label>
            <span>Receipt URL or reference</span>
            <input name="receipt" defaultValue={row?.receipt} maxLength={120} />
          </label>
          <label>
            <span>Notes</span>
            <textarea name="notes" defaultValue={row?.notes} maxLength={1000} />
          </label>
          <FormActions
            cancel={cancel}
            busy={busy}
            error={error}
            label={row ? 'Save changes' : 'Record expense'}
          />
        </form>
      )}
      {settled && !row.reversedAt && !reversing && (
        <button className="rr-button--text" type="button" onClick={() => setReversing(true)}>
          Reverse settled expense
        </button>
      )}
      {row?.reversedAt && <p>Reversed {when(row.reversedAt, timezone)}</p>}
      {row && <ExpenseHistory row={row} timezone={timezone} />}
    </section>
  );
}

function BookingPicker() {
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const request = useFinance('/bookings', { search }, search.length >= 2);
  return (
    <>
      <label>
        <span>Booking reference</span>
        <input
          value={text}
          maxLength={80}
          onChange={(event) => {
            setText(event.target.value);
            setSearch('');
          }}
          placeholder="RR-…"
        />
      </label>
      <div className="finance-booking-match">
        <button
          type="button"
          className="rr-button--outline"
          disabled={text.trim().length < 2}
          onClick={() => setSearch(text.trim())}
        >
          Find bookings
        </button>
        {search &&
          (request.isPending ? (
            <p role="status">Finding bookings…</p>
          ) : request.error ? (
            <p role="alert">{request.error.message}</p>
          ) : request.data?.rows.length ? (
            <label>
              <span>Booking</span>
              <select name="bookingId" key={search} defaultValue="" required>
                <option value="" disabled>
                  Choose a booking
                </option>
                {request.data.rows.map((row) => (
                  <option value={row.id} key={row.id}>
                    {row.reference} · {row.status}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p>No matching booking references.</p>
          ))}
      </div>
    </>
  );
}

export function TransactionForm({ mode, row, cancel, onSaved, maxDate }) {
  const { submit, error, busy } = useSubmit(onSaved);
  const refund = mode === 'refund';
  const adjustment = mode === 'adjustment';
  const title = refund
    ? row?.type === 'deposit_collection'
      ? 'Record deposit return'
      : 'Record rental refund'
    : adjustment
      ? 'Record revenue adjustment'
      : 'Record payment';
  return (
    <section className="finance-card">
      <h3>{title}</h3>
      <p>
        {refund
          ? 'Record the refund after returning the money to the customer.'
          : adjustment
            ? 'This changes recognized revenue. Cash receipts and refunds are recorded separately.'
            : 'Record a completed receipt for rental charges or a refundable deposit.'}
      </p>
      <form
        className="finance-form"
        onSubmit={(event) =>
          submit(event, ({ bookingId, amount: inputAmount, reference, note, ...values }) => {
            const amount = paise(inputAmount);
            if (!adjustment && amount < 0) throw new Error('Enter a positive amount.');
            if (!refund && !bookingId && !row?.bookingId)
              throw new Error('Find and select a booking first.');
            if (refund)
              return {
                path: '/payments/' + row.id + '/refund',
                body: { ...values, amount, reference, reason: note },
              };
            if (adjustment)
              return {
                path: '/adjustments',
                body: {
                  ...values,
                  amount,
                  reference,
                  notes: note,
                  bookingId: bookingId || row.bookingId,
                },
              };
            return {
              path: '/bookings/' + (bookingId || row.bookingId) + '/payments',
              body: { ...values, amount, reference, note },
            };
          })
        }
      >
        {row ? (
          <div className="finance-booking-reference">
            <strong>{row.bookingRef}</strong>
            {refund && <span>Original receipt {money(row.amount)}</span>}
          </div>
        ) : (
          <BookingPicker />
        )}
        {adjustment ? (
          <>
            <label>
              <span>Adjustment type</span>
              <select name="kind">
                <option value="revenue_adjustment">Rental revenue adjustment</option>
                <option value="cancellation_fee">Retained cancellation fee</option>
              </select>
            </label>
            <label>
              <span>Effective date</span>
              <input name="date" type="date" defaultValue={maxDate} max={maxDate} required />
            </label>
          </>
        ) : (
          !refund && (
            <>
              <label>
                <span>Payment purpose</span>
                <select name="purpose">
                  <option value="rental">Rental charges</option>
                  <option value="deposit">Refundable deposit</option>
                </select>
              </label>
              <MethodField />
            </>
          )
        )}
        <label>
          <span>Amount (INR){adjustment && ' · signed'}</span>
          <input name="amount" inputMode="decimal" required />
        </label>
        <label>
          <span>Reference number</span>
          <input name="reference" maxLength={120} />
        </label>
        <label>
          <span>{refund || adjustment ? 'Reason' : 'Notes'}</span>
          <textarea
            name="note"
            minLength={refund || adjustment ? 3 : undefined}
            maxLength={adjustment ? 1000 : 300}
            required={refund || adjustment}
          />
        </label>
        <FormActions cancel={cancel} busy={busy} error={error} label={title} />
      </form>
    </section>
  );
}
