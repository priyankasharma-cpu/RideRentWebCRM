import { useState } from 'react';
import { Languages } from 'lucide-react';
import { rentalPolicyTranslations } from '../../config/rentalPolicyTranslations.js';
import './VehicleRentalPolicy.css';

export function VehicleRentalPolicy() {
  const [language, setLanguage] = useState('en');
  const rentalPolicy = rentalPolicyTranslations[language];
  return (
    <article className="vehicle-rental-policy" lang={rentalPolicy.lang}>
      <header className="vehicle-rental-policy__header">
        <div className="vehicle-rental-policy__topbar">
          <p className="vehicle-rental-policy__eyebrow">{rentalPolicy.eyebrow}</p>
          <div className="policy-language">
            <span className="policy-language__label">
              <Languages size={16} aria-hidden="true" />
              {rentalPolicy.languageLabel}
            </span>
            <div
              className="policy-language__options"
              role="group"
              aria-label={rentalPolicy.languageLabel}
            >
              <button
                type="button"
                lang="en"
                aria-pressed={language === 'en'}
                onClick={() => setLanguage('en')}
              >
                English
              </button>
              <button
                type="button"
                lang="hi"
                aria-pressed={language === 'hi'}
                onClick={() => setLanguage('hi')}
              >
                हिंदी
              </button>
              <button
                type="button"
                lang="hi-Latn"
                aria-pressed={language === 'hinglish'}
                onClick={() => setLanguage('hinglish')}
              >
                Easy Hinglish
              </button>
            </div>
            <span className="policy-language__note">{rentalPolicy.availableNote}</span>
          </div>
        </div>
        <h1>{rentalPolicy.title}</h1>
        <dl className="vehicle-rental-policy__metadata">
          {[
            [rentalPolicy.metadataLabels[0], rentalPolicy.location],
            [rentalPolicy.metadataLabels[1], rentalPolicy.effectiveDate],
            [rentalPolicy.metadataLabels[2], rentalPolicy.operator],
            [rentalPolicy.metadataLabels[3], rentalPolicy.registeredAddress],
            [rentalPolicy.metadataLabels[4], rentalPolicy.contact],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="vehicle-rental-policy__review">{rentalPolicy.reviewNote}</p>
      </header>
      <nav className="vehicle-rental-policy__contents" aria-label={rentalPolicy.contentsLabel}>
        <h2>{rentalPolicy.contentsTitle}</h2>
        <ol>
          {rentalPolicy.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="vehicle-rental-policy__body">
        {rentalPolicy.sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`rental-policy-title-${index + 1}`}
          >
            <h2 id={`rental-policy-title-${index + 1}`}>
              {index + 1}. {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.details && (
              <dl>
                {section.details.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}
      </div>
      <p className="vehicle-rental-policy__closing">{rentalPolicy.closing}</p>
    </article>
  );
}
