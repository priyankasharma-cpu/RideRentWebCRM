import { useApp } from '../../hooks/useApp.js';
import { Phone, MapPin, Mail } from 'lucide-react';
import { CallLink } from '../common/CallLink.jsx';
import './ContactDetails.css';
export function ContactDetails() {
  const { config } = useApp();
  return (
    <div className="contact-grid">
      <div className="rr-panel">
        <Phone />
        <h3>Give us a call</h3>
        <p>{config?.phoneDisplay}</p>
        {config?.phonePlaceholder && (
          <span className="subtle-note">Placeholder contact — update in admin settings.</span>
        )}
        <CallLink />
      </div>
      <div className="rr-panel">
        <MapPin />
        <h3>Pickup location</h3>
        <p>{config?.address}</p>
      </div>
      <div className="rr-panel">
        <Mail />
        <h3>Write to us</h3>
        <a href={'mailto:' + config?.email}>{config?.email}</a>
        <p>Demo contact details</p>
      </div>
    </div>
  );
}
