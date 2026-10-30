import { SearchField } from '../components/SearchField.jsx';
import { Filters } from '../components/Filters.jsx';
import { useResource } from '../../hooks/useResource.js';
import { useState } from 'react';
import { useAdminAction } from '../hooks/useAdminAction.js';
import { PageTitle } from '../components/PageTitle.jsx';
import { ArrowUpRight } from 'lucide-react';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { Loading } from '../../components/common/Loader.jsx';
import { formatTime, money } from '../../utils/formatters.js';
import { api } from '../../services/apiClient.js';
import { Status } from '../../components/common/StatusBadge.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import './Customers.css';
export function Customers() {
  const { data, error, loading, reload } = useResource('/admin/customers', 15000),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState(null);
  const action = useAdminAction(reload);
  return (
    <>
      <PageTitle
        title="People behind every journey."
        subtitle="Customer history, verification and outstanding balances."
      />
      <Filters>
        <SearchField
          placeholder="Search name or phone…"
          aria-label="Search customers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          iconSize={16}
        />
      </Filters>
      <ErrorBox>{error || action.error}</ErrorBox>
      {loading ? (
        <Loading />
      ) : (
        <section className="rr-panel table-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>License status</th>
                  <th>Bookings</th>
                  <th>Outstanding</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data
                  ?.filter((c) =>
                    `${c.name} ${c.phone}`.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                        <small>Since {formatTime(c.created_at)}</small>
                      </td>
                      <td>
                        <a href={'tel:' + c.phone}>{c.phone}</a>
                        <small>{c.email || 'No email provided'}</small>
                      </td>
                      <td>
                        <button
                          className="rr-button--text"
                          disabled={action.busy}
                          onClick={() =>
                            action.execute(() =>
                              api('/admin/customers/' + c.id, {
                                method: 'PATCH',
                                body: {
                                  verified: !c.verified,
                                },
                              }),
                            )
                          }
                        >
                          <Status value={c.verified ? 'Verified' : 'Unverified'} />
                        </button>
                      </td>
                      <td>{c.bookings.length}</td>
                      <td>{money(c.bookings.reduce((sum, b) => sum + b.outstanding, 0))}</td>
                      <td>
                        <button className="table-action" onClick={() => setSelected(c)}>
                          View History <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {selected && (
        <Modal title={selected.name + ' · Rental history'} onClose={() => setSelected(null)}>
          <div className="customer-history">
            {selected.bookings.map((b) => (
              <div key={b.id}>
                <strong>{b.vehicle.name}</strong>
                <Status value={b.status} />
                <p>
                  {b.reference} · {formatTime(b.starts_at)}
                </p>
                <p>
                  Rental paid {money(b.rentalPaid)} · Outstanding {money(b.outstanding)}
                </p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
