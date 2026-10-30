import { FinalCTA } from '../home/FinalCTA';
import { content } from '../../config/pageContent.js';
import { ContactDetails } from '../contact/ContactDetails.jsx';
import { HowItWorksSteps } from './HowItWorksSteps.jsx';
import { FAQContent } from './FAQContent.jsx';
import { RentalPolicyContent } from './RentalPolicyContent.jsx';
import { PrivacyContent } from './PrivacyContent.jsx';
import { AboutFeatures } from './AboutFeatures.jsx';
export function InfoPage({ kind }) {
  const [eyebrow, title, description] = content[kind] || content.about;
  const Section =
    {
      contact: ContactDetails,
      'how-it-works': HowItWorksSteps,
      faq: FAQContent,
      'rental-policy': RentalPolicyContent,
      terms: RentalPolicyContent,
      'privacy-policy': PrivacyContent,
      about: AboutFeatures,
    }[kind] || AboutFeatures;
  return (
    <main className="container page info-page">
      <div className="page-heading">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <Section />
      <FinalCTA
        titleLead="Where will you"
        titleAccent="go next?"
        ctaLabel="Explore the Fleet"
        contained={false}
      />
    </main>
  );
}
