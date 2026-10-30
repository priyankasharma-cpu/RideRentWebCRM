import { AccountSecurity } from '../features/settings/AccountSecurity.jsx';
import { ShopSettingsForm } from '../features/settings/ShopSettingsForm.jsx';
import { useApp } from '../../hooks/useApp.js';
import { useAdminAction } from '../hooks/useAdminAction.js';
import { useState } from 'react';
import { Loading } from '../../components/common/Loader.jsx';
import { api } from '../../services/apiClient.js';
import { PageTitle } from '../components/PageTitle.jsx';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { AuditTrail } from '../features/settings/AuditTrail.jsx';
import './Settings.css';
export function Settings() {
  const { config, setConfig, user } = useApp();
  const action = useAdminAction();
  const [auditOpen, setAuditOpen] = useState(false);
  if (!config) return <Loading />;
  const submit = async (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const result = await action.execute(
      () =>
        api('/admin/settings', {
          method: 'PUT',
          body: {
            ...config,
            ...values,
            phonePlaceholder: e.currentTarget.phonePlaceholder.checked,
            taxBps: Math.round(Number(values.taxPercent) * 100),
            roundingMinutes: Number(values.roundingMinutes),
            lateGraceMinutes: Number(values.lateGraceMinutes),
            cancellationHours: Number(values.cancellationHours),
            maxRentalDays: Number(values.maxRentalDays),
          },
        }),
      'Shop settings updated.',
    );
    if (result) setConfig(result);
  };
  return (
    <>
      <PageTitle
        title="Make RideRent your own."
        subtitle="Contact details, rental rules and account security."
      />
      <ErrorBox>{action.error}</ErrorBox>
      <div className="settings-grid">
        {user.role === 'admin' && (
          <ShopSettingsForm submit={submit} config={config} action={action} />
        )}
        <AccountSecurity
          action={action}
          FormData={FormData}
          user={user}
          setAuditOpen={setAuditOpen}
        />
      </div>
      {auditOpen && <AuditTrail onClose={() => setAuditOpen(false)} />}
    </>
  );
}
