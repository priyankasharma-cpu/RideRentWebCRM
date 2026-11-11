import { useEffect } from 'react';
import { ContactMap } from '../components/contact/ContactMap.jsx';
import { contactLocation } from '../config/contactLocation.js';
import { ContactHero } from '../components/contact/ContactHero.jsx';
import { ContactDetails } from '../components/contact/ContactDetails.jsx';
import { ContactForm } from '../components/contact/ContactForm.jsx';
import { FinalCTA } from '../components/home/FinalCTA.jsx';
import './Contact.css';

export default function ContactPage() {
  useEffect(() => {
    const oldTitle = document.title;
    let description = document.querySelector('meta[name="description"]');
    const existing = Boolean(description);
    const oldDescription = description?.getAttribute('content');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    document.title = 'Contact RideRent | Bike, Scooter & Car Rental in Vijay Nagar, Indore';
    description.content =
      'Contact RideRent for bike, scooter and car rental enquiries in Vijay Nagar, Indore 452010. Ask about vehicles, bookings and pickup details.';
    return () => {
      document.title = oldTitle;
      if (!existing) description.remove();
      else if (oldDescription === null) description.removeAttribute('content');
      else description.setAttribute('content', oldDescription);
    };
  }, []);

  return (
    <main className="contact-page">
      <ContactHero />
      <section
        className="contact-page__container contact-page__support"
        aria-labelledby="contact-options-title"
      >
        <div className="contact-page__support-details">
          <p className="contact-page__eyebrow">GET IN TOUCH</p>
          <h2 id="contact-options-title">We're here to help.</h2>
          <p className="contact-page__support-description">
            Looking for a bike, scooter or car rental in Vijay Nagar, Indore? Get help choosing your
            ride, planning pickup or checking an existing booking.
          </p>
          <ContactDetails pickupLocation={contactLocation.address} />
        </div>
        <ContactForm />
      </section>
      <ContactMap />
      <FinalCTA titleLead="Where will you" titleAccent="go next?" ctaLabel="Explore the Fleet" />
    </main>
  );
}
