import { aboutContent } from '../../config/aboutContent.js';
import './AboutMission.css';

export function AboutMission() {
  const { mission } = aboutContent;
  return (
    <section className="about-mission about-page__container" aria-labelledby="about-mission-title">
      <div className="about-mission__content">
        <p className="about-page__eyebrow">{mission.eyebrow}</p>
        <h2 id="about-mission-title" className="about-page__heading">
          {mission.title}
        </h2>
        <p className="about-mission__description">{mission.description}</p>
        <dl className="about-mission__values">
          {mission.values.map(({ title, description }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="about-mission__visual">
        <img
          src={mission.image.src}
          alt={mission.image.alt}
          width="850"
          height="567"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
}
