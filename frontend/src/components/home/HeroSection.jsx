import { homeContent } from '../../config/homeContent';
import { imageConfig } from '../../config/imageConfig';
import { CallLink } from '../common/CallLink.jsx';
import { BookingSearch } from './BookingSearch.jsx';
import { Crown } from 'lucide-react';
import './HeroSection.css';
export function HeroSection() {
  return (
    <section
      className="hero"
      style={{
        '--hero-image-light': `url(${imageConfig.hero.light})`,
        '--hero-image-dark': `url(${imageConfig.hero.dark})`,
      }}
      id="home"
    >
      <div className="hero-art" />
      <div className="hero-shade" />
      <div className="container hero-inner">
        <div className="hero-copy">
          <div className="eyebrow pill">
            <span className="tiny-dot" /> {homeContent.hero.eyebrow}{' '}
          </div>
          <h1>
            <span className="light-title">
              {' '}
              {homeContent.hero.titleLead} <br />
              <em>{homeContent.hero.titleAccent}</em>
              <br /> {homeContent.hero.titleEnd}
              <span className="title-dot">.</span>
            </span>
            <span className="dark-title">
              {' '}
              {homeContent.hero.darkTitleLead} <br />
              <em>{homeContent.hero.darkTitleAccent}</em>
            </span>
          </h1>
          <p className="hero-sub">
            <strong>{homeContent.hero.descriptionLead}</strong>
            <br /> {homeContent.hero.description}{' '}
          </p>
          <CallLink className="hero-call-link">{homeContent.hero.callLabel}</CallLink>
          <BookingSearch />
        </div>
        <div className="hero-note">
          {' '}
          {homeContent.hero.annotationLead} <br />
          <span>{homeContent.hero.annotationEnd}</span>
          <svg width="55" height="66" viewBox="0 0 55 66">
            <path
              d="M5 2Q48 14 33 59M23 49L33 61L44 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div className="rate-badge">
          <span>
            <Crown size={24} />
          </span>
          <div>
            {' '}
            {homeContent.hero.badgeLead}
            <strong>{homeContent.hero.badgeAccent}</strong>
          </div>
        </div>
        <div className="review-badge">
          <div className="avatars">
            <span>AR</span>
            <span>MS</span>
            <span>RK</span>
          </div>
          <div>
            <strong>{homeContent.hero.reviewsTitle}</strong>
            <small>{homeContent.hero.reviewsDescription}</small>
          </div>
          <div className="review-stars">
            <span>★★★★★</span>
            <strong>
              {' '}
              {homeContent.hero.sampleRating} <small>/ 5</small>
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
