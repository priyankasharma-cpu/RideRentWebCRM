import { useResource } from '../../hooks/useResource.js';
import { useState } from 'react';
import { useApp } from '../../hooks/useApp.js';
import { useAdminAction } from '../hooks/useAdminAction.js';
import { PageTitle } from '../components/PageTitle.jsx';
import { Plus } from 'lucide-react';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { Loading } from '../../components/common/Loader.jsx';
import { Status } from '../../components/common/StatusBadge.jsx';
import { api } from '../../services/apiClient.js';
import { Modal } from '../../components/common/Modal.jsx';
import './Staff.css';
export function Staff() {
  const { data, error, loading, reload } = useResource('/admin/staff'),
    [adding, setAdding] = useState(false),
    { user } = useApp();
  const action = useAdminAction(reload);
  return (
    <>
      <PageTitle
        title="A great team keeps things moving."
        subtitle="Administrators manage fleet, finances and access. Staff manage daily rentals."
      >
        <button className="rr-button" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add Staff Member
        </button>
      </PageTitle>
      <ErrorBox>{error || action.error}</ErrorBox>
      {loading ? (
        <Loading />
      ) : (
        <div className="staff-grid">
          {data?.map((s) => (
            <div className="rr-panel staff-card" key={s.id}>
              <div className="staff-avatar">{s.name[0]}</div>
              <h3>{s.name}</h3>
              <p>{s.email}</p>
              <Status value={s.role} />
              <Status value={s.active ? 'Active' : 'Inactive'} />
              {s.id !== user.id && (
                <button
                  className="rr-button--outline full-width"
                  disabled={action.busy}
                  onClick={() =>
                    action.execute(() =>
                      api('/admin/staff/' + s.id, {
                        method: 'PATCH',
                        body: {
                          active: !s.active,
                        },
                      }),
                    )
                  }
                >
                  {s.active ? 'Disable Access' : 'Enable Access'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {adding && (
        <Modal title="Add someone to your team" onClose={() => setAdding(false)}>
          <form
            className="editor-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await action.execute(() =>
                api('/admin/staff', {
                  method: 'POST',
                  body: Object.fromEntries(new FormData(e.currentTarget)),
                }),
              );
              if (result) setAdding(false);
            }}
          >
            <label>
              Full name
              <input name="name" minLength="2" required />
            </label>
            <label>
              Email
              <input type="email" name="email" required />
            </label>
            <label>
              Temporary password · at least 12 characters
              <input
                type="password"
                name="password"
                minLength="12"
                autoComplete="new-password"
                required
              />
            </label>
            <label>
              Role
              <select name="role">
                <option value="staff">Staff</option>
                <option value="admin">Administrator</option>
              </select>
            </label>
            <ErrorBox>{action.error}</ErrorBox>
            <button className="rr-button" disabled={action.busy}>
              Create Staff Account
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
