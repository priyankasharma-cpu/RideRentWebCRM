import { useApp } from '../../hooks/useApp.js';
import { PhoneIncoming, MapPin, Mail, ArrowUpRight } from 'lucide-react';
import { contactInfo } from '../../utils/contactInfo.js';
import { CallLink } from '../common/CallLink.jsx';
import './ContactDetails.css';

export function ContactDetails({ pickupLocation } = {}) {
  const { config } = useApp();
  const { phone, canCall, email, address: configuredAddress } = contactInfo(config);
  const address = pickupLocation || configuredAddress;
  return (
    <div className="contact-grid">
      <article className="contact-card">
        <span className="contact-card__icon">
          <PhoneIncoming size={23} aria-hidden="true" />
        </span>
        <h3>Call Support</h3>
        <p>Help with your ride or booking.</p>
        {canCall ? (
          <>
            <strong className="contact-card__number">{phone.display}</strong>
            <CallLink className="contact-card__action" />
          </>
        ) : (
          <span className="contact-card__unavailable">
            Phone support details are not available yet.
          </span>
        )}
        {phone.placeholder && (
          <span className="contact-card__warning">
            Placeholder contact — update in admin settings.
          </span>
        )}
      </article>
      <article className="contact-card">
        <span className="contact-card__icon">
          <MapPin size={23} aria-hidden="true" />
        </span>
        <h3>Pickup Location</h3>
        <p>Confirm your pickup point before you travel.</p>
        {address ? (
          <address>{address}</address>
        ) : (
          <span className="contact-card__unavailable">
            Pickup address is not available yet. Please confirm with the shop.
          </span>
        )}
      </article>
      <article className="contact-card">
        <span className="contact-card__icon">
          <Mail size={23} aria-hidden="true" />
        </span>
        <h3>Email Support</h3>
        <p>Include your booking reference, if available.</p>
        {email ? (
          <a className="contact-card__action" href={`mailto:${email}`}>
            {email}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        ) : (
          <span className="contact-card__unavailable">
            Email support details are not available yet.
          </span>
        )}
        {phone.placeholder && (
          <span className="contact-card__warning">Demo email — confirm before sending.</span>
        )}
      </article>
    </div>
  );
}
