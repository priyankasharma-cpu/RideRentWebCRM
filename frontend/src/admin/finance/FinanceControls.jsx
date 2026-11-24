import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { periods, sourceNames, reports, reportPath, when } from './financeModel.js';
import './FinanceControls.css';

export function SelectField({ label, value, options, onChange, blank, ...props }) {
  return (
    <label>
      <span>{label}</span>
      <select {...props} value={value} onChange={(event) => onChange(event.target.value)}>
        {blank && <option value="">{blank}</option>}
        {Object.entries(options).map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ExportControl({ filters, report, full = false, disabled }) {
  const [format, setFormat] = useState('csv');
  const [reportType, setReportType] = useState(report || 'summary');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function download() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(
        '/api' + reportPath({ ...filters, format, report: reportType }),
        {
          credentials: 'same-origin',
        },
      );
      if (!response.ok) throw new Error((await response.json()).error || 'Report export failed.');
      const filename = response.headers
        .get('content-disposition')
        ?.match(/filename="?([^";]+)"?/)?.[1];
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'riderent-report.' + format;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="finance-export">
      {full && (
        <SelectField label="Report" value={reportType} options={reports} onChange={setReportType} />
      )}
      <SelectField
        label="Format"
        value={format}
        options={{ csv: 'CSV', xlsx: 'Excel', pdf: 'Printable PDF' }}
        onChange={setFormat}
      />
      <button className="rr-button" type="button" disabled={disabled || busy} onClick={download}>
        <Download size={16} /> {busy ? 'Preparing…' : 'Export report'}
      </button>
      {error && (
        <small role="alert" className="finance-error">
          {error}
        </small>
      )}
    </div>
  );
}

export function FinanceHeader({
  title,
  description,
  filters,
  setFilter,
  sourceLocked,
  showInterval,
  showSource,
  updated,
  refresh,
  refreshing,
  extra,
}) {
  return (
    <header className="finance-header">
      <div className="finance-heading">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
          {updated && (
            <small>
              Updated {when(updated.generatedAt, updated.timezone)} · {updated.timezone} · INR
            </small>
          )}
        </div>
        <button
          className="rr-button--outline"
          type="button"
          onClick={refresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
      <div className="finance-controls">
        <SelectField
          label="Date range"
          options={periods}
          value={filters.period}
          onChange={(value) => setFilter('period', value)}
        />
        {filters.period === 'custom' && (
          <>
            <label>
              <span>From</span>
              <input
                type="date"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(e) => setFilter('from', e.target.value)}
              />
            </label>
            <label>
              <span>Through</span>
              <input
                type="date"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(e) => setFilter('to', e.target.value)}
              />
            </label>
          </>
        )}
        {showSource && (
          <SelectField
            label="Booking source"
            value={filters.source}
            options={sourceNames}
            blank="All sources"
            disabled={sourceLocked}
            onChange={(value) => setFilter('source', value)}
          />
        )}
        <SelectField
          label="Vehicle category"
          value={filters.category}
          options={{ Bike: 'Bikes', Scooter: 'Scooters', Car: 'Cars' }}
          blank="All categories"
          onChange={(value) => setFilter('category', value)}
        />
        {showInterval && (
          <SelectField
            label="Group trends by"
            value={filters.interval}
            options={{ day: 'Day', week: 'Week', month: 'Month', quarter: 'Quarter', year: 'Year' }}
            blank="Automatic"
            onChange={(value) => setFilter('interval', value)}
          />
        )}
        {extra}
      </div>
    </header>
  );
}
