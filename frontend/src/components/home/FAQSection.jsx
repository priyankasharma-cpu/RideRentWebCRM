import { homeContent } from '../../config/homeContent';
import { FAQ } from '../common/FAQList.jsx';
import './FAQSection.css';
export function FAQSection() {
  return (
    <section className="container section home-faq">
      <div className="eyebrow">{homeContent.faq.eyebrow}</div>
      <h2>
        {' '}
        {homeContent.faq.titleLead} <em>{homeContent.faq.titleAccent}</em>
      </h2>
      <FAQ />
    </section>
  );
}
