import { api } from '../../../services/apiClient.js';
import { ShieldCheck } from 'lucide-react';
import './AccountSecurity.css';
export function AccountSecurity({ action, FormData, user, setAuditOpen }) {
  return (
    <aside>
      <form
        className="rr-panel editor-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const result = await action.execute(
            () =>
              api('/admin/change-password', {
                method: 'POST',
                body: Object.fromEntries(new FormData(form)),
              }),
            'Password updated. Other sessions were signed out.',
          );
          if (result) form.reset();
        }}
      >
        <h3>Account security</h3>
        <p className="subtle-note">Signed in as {user.email}</p>
        <label>
          Current password
          <input name="current" type="password" autoComplete="current-password" required />
        </label>
        <label>
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength="12"
            required
          />
        </label>
        <button className="rr-button--outline" disabled={action.busy}>
          Change Password
        </button>
      </form>
      {user.role === 'admin' && (
        <div className="rr-panel audit-link">
          <ShieldCheck size={25} />
          <h3>A record of every action</h3>
          <p>Review staff sign-ins, reservations, payments and fleet changes.</p>
          <button className="rr-button--outline" onClick={() => setAuditOpen(true)}>
            View Audit Trail
          </button>
        </div>
      )}
    </aside>
  );
}
