import { Package, ShieldCheck, Pencil, Pause, Play, Archive } from 'lucide-react';
import { money } from '../../../utils/formatters.js';
import './AddOnCard.css';
export function AddOnCard({ row, busy, onEdit, onToggle, onArchive }) {
  return (
    <article className="rr-panel admin-addon">
      <div className="admin-addon__heading">
        <span className="admin-addon__icon">
          {row.code === 'helmet' ? <ShieldCheck size={23} /> : <Package size={23} />}
        </span>
        <div>
          <h2>{row.name}</h2>
          <small>
            {row.code} · Version {row.version}
          </small>
        </div>
        <span className="admin-addon__status">
          {row.archived_at ? 'Archived' : row.enabled ? 'Enabled' : 'Paused'}
        </span>
      </div>
      {row.description && <p>{row.description}</p>}
      <div className="admin-addon__price">
        <strong>{money(row.rate)}</strong>
        <span>/ unit / {row.billing === 'hour' ? 'hour' : 'booking'}</span>
      </div>
      <dl className="admin-addon__stock">
        {[
          ['Total stock', row.stock],
          ['Unavailable', row.unserviceable],
          ['Reserved (peak)', row.inventory.reserved],
          ['Active / inspecting', row.inventory.issued],
          ['Available (minimum)', row.inventory.available],
          ['Checkout maximum', row.maxQuantity],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <ul className="admin-addon__rules">
        {row.categories.map((rule) => (
          <li key={rule.category}>
            {rule.category}
            <span>{rule.includedQuantity} included per vehicle</span>
          </li>
        ))}
      </ul>
      {!row.archived_at && (
        <div className="admin-addon__actions">
          <button className="rr-button--outline" disabled={busy} onClick={() => onEdit(row)}>
            <Pencil size={14} />
            Edit
          </button>
          <button className="rr-button--outline" disabled={busy} onClick={() => onToggle(row)}>
            {row.enabled ? <Pause size={14} /> : <Play size={14} />}
            {row.enabled ? 'Pause' : 'Enable'}
          </button>
          {row.code !== 'helmet' && (
            <button className="admin-addon__archive" disabled={busy} onClick={() => onArchive(row)}>
              <Archive size={14} />
              Archive
            </button>
          )}
        </div>
      )}
    </article>
  );
}
