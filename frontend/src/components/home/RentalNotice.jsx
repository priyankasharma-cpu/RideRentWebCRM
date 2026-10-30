import { homeContent } from '../../config/homeContent';
import { ShieldCheck } from 'lucide-react';
import { CallLink } from '../common/CallLink.jsx';
import './RentalNotice.css';
export function RentalNotice() {
  return (
    <section className="container policy-section" id="policy">
      <ShieldCheck size={30} />
      <div>
        <h3>{homeContent.rental.title}</h3>
        <p> {homeContent.rental.description} </p>
      </div>
      <CallLink className="rr-button--text">{homeContent.rental.callLabel}</CallLink>
    </section>
  );
}
