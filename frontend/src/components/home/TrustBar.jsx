import { benefits } from '../../config/homeContent.js';
import './TrustBar.css';
export function TrustBar() {
  return (
    <section className="benefits">
      <div className="container benefits-grid">
        {benefits.map((b) => (
          <div className="benefit" key={b.title}>
            <span className={'benefit-icon ' + b.tone}>
              <b.icon size={24} />
            </span>
            <div>
              <strong>{b.title}</strong>
              <p>{b.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
