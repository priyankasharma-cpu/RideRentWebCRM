import { Activity } from 'lucide-react';
import './StatCard.css';
export function StatCard({ label, value, icon: Icon = Activity, detail, tone = 'blue' }) {
  return (
    <div className="stat-card rr-panel">
      <div>
        <span>{label}</span>
        <div className="stat-icon" data-tone={tone}>
          <Icon size={19} />
        </div>
      </div>
      <strong>{value}</strong>
      <p>{detail || 'Calculated from rental records'}</p>
    </div>
  );
}
