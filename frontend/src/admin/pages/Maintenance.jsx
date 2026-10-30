import { useResource } from '../../hooks/useResource.js';
import { useState } from 'react';
import { defaultPeriod, toUTC } from '../../utils/rentalTime.js';
import { useAdminAction } from '../hooks/useAdminAction.js';
import { PageTitle } from '../components/PageTitle.jsx';
import { Plus, Wrench, Check } from 'lucide-react';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { Loading } from '../../components/common/Loader.jsx';
import { Status } from '../../components/common/StatusBadge.jsx';
import { formatTime } from '../../utils/formatters.js';
import { api } from '../../services/apiClient.js';
import { Modal } from '../../components/common/Modal.jsx';
import { PeriodFields } from '../../components/booking/PeriodFields.jsx';
import './Maintenance.css';
export function Maintenance() {
  const { data, error, loading, reload } = useResource('/admin/maintenance', 15000),
    { data: vehicles } = useResource('/admin/vehicles'),
    [adding, setAdding] = useState(false),
    [period, setPeriod] = useState(defaultPeriod);
  const action = useAdminAction(reload);
  return (
    <>
      <PageTitle
        title="Take care of the rides that move you."
        subtitle="Block service windows and release vehicles after maintenance."
      >
        <button className="rr-button" onClick={() => setAdding(true)}>
          <Plus size={16} /> Schedule Maintenance
        </button>
      </PageTitle>
      <ErrorBox>{error || action.error}</ErrorBox>
      {loading ? (
        <Loading />
      ) : (
        <div className="maintenance-grid">
          {data?.map((m) => (
            <article className="rr-panel maintenance-card" key={m.id}>
              <div className="maintenance-card-icon">
                <Wrench size={24} />
                <Status value={m.resolved ? 'Resolved' : 'Scheduled'} />
              </div>
              <h3>{m.vehicle_name}</h3>
              <p>{m.reason}</p>
              <div>
                <small>From {formatTime(m.starts_at)}</small>
                <small>Until {formatTime(m.ends_at)}</small>
              </div>
              {!m.resolved && (
                <button
                  className="rr-button--outline"
                  disabled={action.busy}
                  onClick={() =>
                    window.confirm('Confirm the vehicle has been serviced and is ready?') &&
                    action.execute(
                      () =>
                        api('/admin/maintenance/' + m.id + '/resolve', {
                          method: 'POST',
                        }),
                      'Maintenance completed.',
                    )
                  }
                >
                  Complete Maintenance <Check size={14} />
                </button>
              )}
            </article>
          ))}
        </div>
      )}
      {adding && (
        <Modal title="Schedule a service window" onClose={() => setAdding(false)}>
          <form
            className="editor-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const values = Object.fromEntries(new FormData(e.currentTarget));
              const result = await action.execute(() =>
                api('/admin/maintenance', {
                  method: 'POST',
                  body: {
                    ...values,
                    startsAt: toUTC(period.startsAt),
                    endsAt: toUTC(period.endsAt),
                  },
                }),
              );
              if (result) setAdding(false);
            }}
          >
            <label>
              Vehicle
              <select name="vehicleId" required>
                <option value="">Select a vehicle</option>
                {vehicles
                  ?.filter((v) => v.status !== 'Inactive')
                  .map((v) => (
                    <option value={v.id} key={v.id}>
                      {v.name} · {v.registration}
                    </option>
                  ))}
              </select>
            </label>
            <PeriodFields value={period} onChange={setPeriod} />
            <label>
              Service reason
              <textarea name="reason" minLength="3" maxLength="500" required />
            </label>
            <ErrorBox>{action.error}</ErrorBox>
            <button className="rr-button" disabled={action.busy}>
              Save Maintenance Block
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
