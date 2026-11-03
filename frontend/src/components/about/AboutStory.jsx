import { Check } from 'lucide-react';
import { aboutContent } from '../../config/aboutContent.js';
import './AboutStory.css';

export function AboutStory() {
  const { story } = aboutContent;
  return (
    <section className="about-story about-page__container" aria-labelledby="about-story-title">
      <figure className="about-story__visual">
        <img
          src={story.image.src}
          alt={story.image.alt}
          width="850"
          height="567"
          loading="lazy"
          decoding="async"
        />
        <figcaption>{story.caption}</figcaption>
      </figure>
      <div className="about-story__content">
        <p className="about-page__eyebrow">{story.eyebrow}</p>
        <h2 id="about-story-title" className="about-page__heading">
          {story.title}
        </h2>
        {story.paragraphs.map((paragraph) => (
          <p className="about-story__paragraph" key={paragraph}>
            {paragraph}
          </p>
        ))}
        <ul className="about-story__highlights">
          {story.highlights.map((highlight) => (
            <li key={highlight}>
              <Check size={17} aria-hidden="true" />
              {highlight}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
