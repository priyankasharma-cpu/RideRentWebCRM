import { MapPin, ArrowUpRight } from 'lucide-react';
import { contactLocation } from '../../config/contactLocation.js';
import './ContactMap.css';

export function ContactMap() {
  const query = encodeURIComponent(contactLocation.query);
  return (
    <section className="contact-map contact-page__container" aria-labelledby="contact-map-title">
      <div className="contact-map__heading">
        <div>
          <p className="contact-page__eyebrow">FIND YOUR WAY HERE</p>
          <h2 id="contact-map-title">Visit us in Vijay Nagar.</h2>
          <p className="contact-map__address">
            <MapPin size={16} aria-hidden="true" />
            {contactLocation.address}
          </p>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${query}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Google Maps
          <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </div>
      <div className="contact-map__frame">
        <iframe
          title="Google Map of Vijay Nagar, Indore 452010"
          src={`https://www.google.com/maps?q=${query}&z=15&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <p className="contact-map__note">{contactLocation.note}</p>
    </section>
  );
}
