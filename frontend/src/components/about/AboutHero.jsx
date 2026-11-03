import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { aboutContent } from '../../config/aboutContent.js';
import './AboutHero.css';

export function AboutHero() {
  const { hero } = aboutContent;
  return (
    <section className="about-hero" aria-labelledby="about-title">
      <div className="about-page__container about-hero__inner">
        <div className="about-hero__content">
          <p className="about-page__eyebrow">{hero.eyebrow}</p>
          <h1 id="about-title" className="about-hero__title">
            {hero.titleLead}
            <span>{hero.titleAccent}</span>
          </h1>
          <p className="about-hero__description">{hero.description}</p>
          <Link className="rr-button about-hero__cta" to={hero.ctaPath}>
            {hero.cta}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <p className="about-hero__detail">{hero.detail}</p>
        </div>
        <figure className="about-hero__visual">
          <img
            src={hero.image.src}
            alt={hero.image.alt}
            width="850"
            height="567"
            fetchPriority="high"
          />
          <figcaption>{hero.image.caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
