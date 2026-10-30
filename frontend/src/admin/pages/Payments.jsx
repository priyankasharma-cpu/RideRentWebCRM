import { SearchField } from '../components/SearchField.jsx';
import { Filters } from '../components/Filters.jsx';
import { useResource } from '../../hooks/useResource.js';
import { useState } from 'react';
import { useAdminAction } from '../hooks/useAdminAction.js';
import { PageTitle } from '../components/PageTitle.jsx';
import { Plus } from 'lucide-react';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { Loading } from '../../components/common/Loader.jsx';
import { Status } from '../../components/common/StatusBadge.jsx';
import { money, formatTime } from '../../utils/formatters.js';
import { Modal } from '../../components/common/Modal.jsx';
import { PaymentForm } from '../features/payments/PaymentForm.jsx';
import { api } from '../../services/apiClient.js';
export function Payments() {
  const { data, error, loading, reload } = useResource('/admin/payments', 15000),
    { data: bookings, reload: reloadBookings } = useResource('/admin/bookings', 15000);
  const [record, setRecord] = useState(false),
    [selected, setSelected] = useState(''),
    [query, setQuery] = useState('');
  const action = useAdminAction(async () => {
    await reload();
    await reloadBookings();
  });
  const b = bookings?.find((b) => b.id === selected);
  return (
    <>
      <PageTitle
        title="Clear records. Confident business."
        subtitle="Manual shop receipts and refunds. No payment gateway is connected."
      >
        <button className="rr-button" onClick={() => setRecord(true)}>
          <Plus size={16} /> Record Receipt
        </button>
      </PageTitle>
      <ErrorBox>{error || action.error}</ErrorBox>
      <Filters>
        <SearchField
          placeholder="Search receipt reference or customer…"
          aria-label="Search payments"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          iconSize={16}
        />
      </Filters>
      {loading ? (
        <Loading />
      ) : (
        <section className="rr-panel table-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Booking / customer</th>
                  <th>Purpose</th>
                  <th>Method</th>
                  <th>Received</th>
                  <th>Refunded</th>
                  <th>Recorded · IST</th>
                </tr>
              </thead>
              <tbody>
                {data?.payments
                  .filter((p) =>
                    (p.reference + ' ' + p.customer_name)
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )
                  .map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.customer_name}</strong>
                        <small>{p.reference}</small>
                      </td>
                      <td>
                        <Status value={p.purpose} />
                      </td>
                      <td>{p.method}</td>
                      <td>
                        <strong>{money(p.amount)}</strong>
                      </td>
                      <td>{money(p.refunded)}</td>
                      <td>
                        {formatTime(p.created_at)}
                        <small>{p.note}</small>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {record && (
        <Modal title="Record a shop receipt" onClose={() => setRecord(false)}>
          <label>
            Booking
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Select a booking</option>
              {bookings
                ?.filter((b) => b.outstanding > 0 && b.status !== 'cancelled')
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.reference} · {b.customer.name} · {money(b.outstanding)} due
                  </option>
                ))}
            </select>
          </label>
          <ErrorBox>{action.error}</ErrorBox>
          {b && (
            <PaymentForm
              booking={b}
              busy={action.busy}
              onSubmit={async (values) => {
                const result = await action.execute(
                  () =>
                    api('/admin/bookings/' + b.id + '/payments', {
                      method: 'POST',
                      body: values,
                    }),
                  'Receipt recorded.',
                );
                if (result) setRecord(false);
              }}
            />
          )}
        </Modal>
      )}
    </>
  );
}
