import { homeContent } from '../../config/homeContent';
import { benefits } from '../../config/homeContent.js';
import './WhyChooseUs.css';
export function WhyChooseUs() {
  return (
    <section className="container section about-section" id="about">
      <div>
        <div className="eyebrow">{homeContent.why.eyebrow}</div>
        <h2>
          {' '}
          {homeContent.why.titleLead} <em>{homeContent.why.titleAccent}</em>
        </h2>
      </div>
      <p> {homeContent.why.description} </p>
      <div className="about-cards">
        {benefits.slice(1).map((b) => (
          <div key={b.title}>
            <b.icon size={30} />
            <h3>{b.title}</h3>
            <p>{b.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
