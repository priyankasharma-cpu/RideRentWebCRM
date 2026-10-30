import { ShieldCheck, Clock3, CarFront } from 'lucide-react';
import './AboutFeatures.css';
export function AboutFeatures() {
  return (
    <div className="about-feature-grid">
      {[
        [
          ShieldCheck,
          'Ready for the road',
          'Maintenance blocks, availability checks and pickup inspections keep operations organized.',
        ],
        [
          Clock3,
          'Hours that fit your plans',
          'Transparent hourly pricing with clearly stated rounding, deposits and late fees.',
        ],
        [
          CarFront,
          'A ride for every day',
          'Choose a bike, scooter or car and manage your booking with your unique reference.',
        ],
      ].map(([Icon, t, d]) => (
        <div className="rr-panel" key={t}>
          <Icon />
          <h3>{t}</h3>
          <p>{d}</p>
        </div>
      ))}
    </div>
  );
}
