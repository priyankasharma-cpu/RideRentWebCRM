import { Filters } from '../../components/Filters.jsx';
import './AnalyticsPeriodFilter.css';
export function AnalyticsPeriodFilter({ range, setRange, data, from, setFrom, to, setTo }) {
  return (
    <Filters>
      <select
        aria-label="Analytics period"
        value={range}
        onChange={(e) => setRange(e.target.value)}
      >
        <option value="1">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="month">This Month</option>
        <option value="7">Last 7 Days</option>
        <option value="30">Last 30 Days</option>
        <option value="custom">Custom · last 30 days</option>
      </select>
      {range === 'custom' && (
        <>
          <input
            aria-label="Analytics start date"
            type="date"
            min={data.daily[0].date}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            aria-label="Analytics end date"
            type="date"
            min={from}
            max={data.daily.at(-1).date}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </>
      )}
    </Filters>
  );
}
