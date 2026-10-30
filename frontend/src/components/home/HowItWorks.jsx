import { homeContent } from '../../config/homeContent';
import './HowItWorks.css';
export function HowItWorks() {
  return (
    <section className="container section steps-section" id="how-it-works">
      <div className="eyebrow">{homeContent.how.eyebrow}</div>
      <h2>
        {' '}
        {homeContent.how.titleLead} <em>{homeContent.how.titleAccent}</em>
      </h2>
      <div className="steps">
        {homeContent.how.steps.map(([n, t, d]) => (
          <div key={n}>
            <span>{n}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
