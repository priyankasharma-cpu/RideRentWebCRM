import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../../hooks/useApp.js';
import { contactInfo } from '../../utils/contactInfo.js';
import { imageConfig, applyImageFallback } from '../../config/imageConfig.js';
import { CallLink } from '../common/CallLink.jsx';
import './ContactHero.css';

export function ContactHero() {
  const { config } = useApp();
  const { canCall } = contactInfo(config);
  return (
    <section className="contact-hero" aria-labelledby="contact-title">
      <div className="contact-page__container contact-hero__inner">
        <div className="contact-hero__content">
          <p className="contact-page__eyebrow">CONTACT RIDERENT</p>
          <h1 id="contact-title">
            Let's Get You <span>on the Road.</span>
          </h1>
          <p className="contact-hero__description">
            A question about your next ride? From choosing a vehicle to planning your pickup, we're
            here to help you find your way forward.
          </p>
          <div className="contact-hero__actions">
            {canCall && <CallLink />}
            <Link to="/vehicles" className="contact-hero__explore">
              Explore Vehicles
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <p className="contact-hero__note">
            For an existing booking, keep your booking reference handy.
          </p>
        </div>
        <figure className="contact-hero__visual">
          <img
            src={imageConfig.categories.car}
            alt="White SUV beside an open mountain landscape"
            onError={applyImageFallback}
            width="850"
            height="567"
            fetchPriority="high"
            decoding="async"
          />
          <figcaption>A ride for every kind of day.</figcaption>
        </figure>
      </div>
    </section>
  );
}
