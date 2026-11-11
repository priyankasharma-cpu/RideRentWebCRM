import { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { AddOnCard } from '../features/addons/AddOnCard.jsx';
import { useResource } from '../../hooks/useResource.js';
import { useAdminAction } from '../hooks/useAdminAction.js';
import { PageTitle } from '../components/PageTitle.jsx';
import { SearchField } from '../components/SearchField.jsx';
import { Loading } from '../../components/common/Loader.jsx';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { AddOnEditor } from '../features/addons/AddOnEditor.jsx';
import { addOnService } from '../../services/addOnService.js';
import './AddOnManagement.css';

export default function AddOnManagement() {
  const resource = useResource('/admin/addons', 30000);
  const action = useAdminAction(resource.reload);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('current');
  const all = resource.data || [];
  const rows = all.filter(
    (row) =>
      row.code !== 'helmet' &&
      `${row.name} ${row.code}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === 'all' ||
        (status === 'archived'
          ? row.archived_at
          : !row.archived_at &&
            (status === 'current' || (status === 'enabled' ? row.enabled : !row.enabled)))),
  );
  const helmetRecord = all.find((row) => row.code === 'helmet');
  const changeEnabled = (row) => {
    if (
      !window.confirm(
        `${row.enabled ? 'Pause' : 'Enable'} new rentals for ${row.name}? Existing bookings will be preserved.`,
      )
    )
      return;
    action.execute(
      () => addOnService.save({ ...row, enabled: !row.enabled }),
      row.enabled ? 'New rentals paused.' : 'New rentals enabled.',
    );
  };
  const archive = (row) => {
    if (
      !window.confirm(
        `Permanently archive ${row.name}? Existing booking records will remain. Use Pause instead if you may offer this item again. Its code cannot be reused.`,
      )
    )
      return;
    action.execute(
      () => addOnService.archive(row),
      'Add-on archived. Historical bookings preserved.',
    );
  };
  return (
    <div className="admin-addons">
      <PageTitle
        title="Helmets & Add-ons"
        subtitle="Manage rental extras, actual stock and included quantities in one place."
      >
        <button
          className="rr-button"
          disabled={resource.loading || Boolean(resource.error)}
          onClick={() => setSelected({})}
        >
          <Plus size={16} /> Add Add-on
        </button>
      </PageTitle>
      {!resource.loading && !resource.error && (
        <section className="admin-addons__helmet" aria-labelledby="helmet-settings-heading">
          <h2 id="helmet-settings-heading" className="admin-addons__section-title">
            Helmet Settings
          </h2>
          {helmetRecord ? (
            <AddOnCard
              row={helmetRecord}
              busy={action.busy}
              onEdit={setSelected}
              onToggle={changeEnabled}
              onArchive={archive}
            />
          ) : (
            <div className="rr-panel">
              <p>Configure real helmet prices, stock and included quantities to enable rentals.</p>
              <button
                className="rr-button--outline"
                onClick={() => setSelected({ code: 'helmet', name: 'Extra helmets' })}
              >
                Configure Helmets
              </button>
            </div>
          )}
        </section>
      )}
      <h2 className="admin-addons__section-title">Other Add-ons</h2>
      <div className="admin-addons__toolbar rr-panel">
        <SearchField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search add-ons"
          placeholder="Search name or code…"
        />
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="current">Current</option>
            <option value="enabled">Enabled</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </label>
        <span>
          {rows.length} {rows.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      <ErrorBox>{resource.error || action.error}</ErrorBox>
      {resource.error && (
        <button className="rr-button--outline" onClick={resource.reload}>
          Retry loading
        </button>
      )}
      <p className="admin-addons__notice">
        Stock summary shows peak future reservations and active/inspecting rentals. Included units
        also consume stock. Actual equipment issue/return tracking is a later workflow.
      </p>
      {resource.loading ? (
        <Loading />
      ) : !resource.error && rows.length === 0 ? (
        <div className="rr-panel admin-addons__empty">
          <Package size={28} />
          <h2>{all.length ? 'No matching items' : 'No add-ons configured yet'}</h2>
          <p>Adjust filters or add an accessory with your shop-approved price and actual stock.</p>
        </div>
      ) : (
        <div className="admin-addons__grid">
          {rows.map((row) => (
            <AddOnCard
              key={row.id}
              row={row}
              busy={action.busy}
              onEdit={setSelected}
              onToggle={changeEnabled}
              onArchive={archive}
            />
          ))}
        </div>
      )}
      <p className="admin-addons__notice">
        Prices affect new quotes; confirmed booking prices remain saved. Helmet Settings stays
        visible above the accessory filters.
      </p>
      {selected && (
        <AddOnEditor
          value={selected}
          helmet={selected.code === 'helmet'}
          onClose={() => setSelected(null)}
          onChanged={resource.reload}
        />
      )}
    </div>
  );
}
