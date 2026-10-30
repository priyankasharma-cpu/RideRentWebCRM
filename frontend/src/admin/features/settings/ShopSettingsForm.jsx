import './ShopSettingsForm.css';
export function ShopSettingsForm({ submit, config, action }) {
  return (
    <form className="rr-panel editor-form" onSubmit={submit}>
      <h3>Shop details & rental policy</h3>
      <div className="form-grid">
        {[
          ['Shop name', 'name', config.name],
          ['Phone display', 'phoneDisplay', config.phoneDisplay],
          ['Phone (+country code)', 'phoneTel', config.phoneTel],
          ['Email', 'email', config.email],
          ['Address', 'address', config.address],
        ].map(([label, name, value]) => (
          <label key={name} className={name === 'address' ? 'span-2' : ''}>
            {label}
            <input
              name={name}
              type={name === 'email' ? 'email' : 'text'}
              defaultValue={value}
              required
            />
          </label>
        ))}
        <label className="checkbox-label span-2">
          <input name="phonePlaceholder" type="checkbox" defaultChecked={config.phonePlaceholder} />{' '}
          Label phone number as placeholder demo contact
        </label>
        <label>
          Tax (%)
          <input
            name="taxPercent"
            type="number"
            defaultValue={config.taxBps / 100}
            min="0"
            max="50"
            step="0.01"
            required
          />
        </label>
        <label>
          Billing block (minutes)
          <select name="roundingMinutes" defaultValue={config.roundingMinutes}>
            {[15, 30, 60].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Late grace period (minutes)
          <input
            name="lateGraceMinutes"
            type="number"
            min="0"
            max="120"
            defaultValue={config.lateGraceMinutes}
            required
          />
        </label>
        <label>
          Online changes cutoff (hours)
          <input
            name="cancellationHours"
            type="number"
            min="0"
            max="72"
            defaultValue={config.cancellationHours}
            required
          />
        </label>
        <label>
          Maximum rental (days)
          <input
            name="maxRentalDays"
            type="number"
            min="1"
            max="90"
            defaultValue={config.maxRentalDays}
            required
          />
        </label>
        <label>
          Shop timezone
          <input value="Asia/Kolkata · IST" readOnly />
        </label>
        <label className="span-2">
          Fuel policy
          <textarea name="fuelPolicy" defaultValue={config.fuelPolicy} maxLength="1000" />
        </label>
        <label className="span-2">
          Distance policy
          <textarea name="distancePolicy" defaultValue={config.distancePolicy} maxLength="1000" />
        </label>
      </div>
      <button className="rr-button" disabled={action.busy}>
        Save Shop Settings
      </button>
    </form>
  );
}
