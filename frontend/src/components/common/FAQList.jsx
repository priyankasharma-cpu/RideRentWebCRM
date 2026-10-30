import { faqs } from '../../config/faqContent.js';
import './FAQList.css';
export function FAQ() {
  return (
    <section className="faq-list">
      {faqs.map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <span>+</span>
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </section>
  );
}
