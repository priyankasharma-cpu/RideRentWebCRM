import { Clock3, ReceiptText, CarFront, CalendarCheck } from 'lucide-react';
import { aboutContent } from '../../config/aboutContent.js';
import './AboutFeatures.css';

const featureIcons = { clock: Clock3, receipt: ReceiptText, car: CarFront, booking: CalendarCheck };

export function AboutFeatures() {
  const { features } = aboutContent;
  return (
    <section className="about-features" aria-labelledby="about-features-title">
      <div className="about-page__container">
        <div className="about-features__heading">
          <p className="about-page__eyebrow">{features.eyebrow}</p>
          <h2 id="about-features-title" className="about-page__heading">
            {features.title}
          </h2>
          <p className="about-features__description">{features.description}</p>
        </div>
        <div className="about-features__grid">
          {features.items.map(({ icon, title, description }) => {
            const Icon = featureIcons[icon] || CarFront;
            return (
              <article className="about-features__card" key={title}>
                <span className="about-features__icon">
                  <Icon size={23} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
