import { homeContent } from '../../config/homeContent';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CallLink } from '../common/CallLink.jsx';
import './FinalCTA.css';
export function FinalCTA({
  titleLead = homeContent.final.titleLead,
  titleAccent = homeContent.final.titleAccent,
  ctaLabel = homeContent.final.cta,
  contained = true,
}) {
  return (
    <div className={contained ? 'container final-cta' : 'final-cta'}>
      <h2>
        {' '}
        {titleLead} <em>{titleAccent}</em>
      </h2>
      <Link className="rr-button" to="/vehicles">
        {' '}
        {ctaLabel} <ArrowRight size={16} />
      </Link>
      <CallLink className="rr-button--outline" />
    </div>
  );
}
