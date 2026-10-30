import { SearchField } from '../components/SearchField.jsx';
import { Filters } from '../components/Filters.jsx';
import { applyImageFallback } from '../../config/imageConfig.js';
import { useResource } from '../../hooks/useResource.js';
import { useState } from 'react';
import { PageTitle } from '../components/PageTitle.jsx';
import { Plus, ArrowUpRight } from 'lucide-react';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { Loading } from '../../components/common/Loader.jsx';
import { Status } from '../../components/common/StatusBadge.jsx';
import { money } from '../../utils/formatters.js';
import { VehicleEditor } from '../features/vehicles/VehicleEditor.jsx';
import './VehicleManagement.css';
export function VehicleManagement() {
  const { data, error, loading, reload } = useResource('/admin/vehicles', 15000),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState(null);
  const rows = (data || []).filter((v) =>
    `${v.name} ${v.registration} ${v.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Good rides start with a great fleet."
        subtitle="Manage rates, deposits, specifications and vehicle readiness."
      >
        <button className="rr-button" onClick={() => setSelected({})}>
          <Plus size={16} /> Add Vehicle
        </button>
      </PageTitle>
      <Filters>
        <SearchField
          placeholder="Search fleet…"
          aria-label="Search fleet"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          iconSize={17}
        />
        <span>{rows.length} vehicles</span>
      </Filters>
      <ErrorBox>{error}</ErrorBox>
      {loading ? (
        <Loading />
      ) : (
        <div className="admin-vehicle-grid">
          {rows.map((v) => (
            <article className="rr-panel admin-vehicle" key={v.id}>
              <img src={v.image} alt={v.name} onError={applyImageFallback} decoding="async" />
              <div>
                <span className="eyebrow">
                  {v.category} · {v.registration}
                </span>
                <h3>{v.name}</h3>
                <Status value={v.physicalStatus} />
                <div className="vehicle-admin-stats">
                  <span>
                    Hourly rate<strong>{money(v.rate)}</strong>
                  </span>
                  <span>
                    Deposit<strong>{money(v.deposit)}</strong>
                  </span>
                  <span>
                    Odometer<strong>{v.odometer} km</strong>
                  </span>
                </div>
                <button className="rr-button--outline full-width" onClick={() => setSelected(v)}>
                  Edit Vehicle <ArrowUpRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {selected && (
        <VehicleEditor vehicle={selected} onClose={() => setSelected(null)} onChanged={reload} />
      )}
    </>
  );
}
