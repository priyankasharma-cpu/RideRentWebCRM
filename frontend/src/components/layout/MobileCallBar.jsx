import { CallLink } from '../common/CallLink.jsx';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './MobileCallBar.css';
export function MobileCallBar() {
  return (
    <div className="mobile-call">
      <CallLink />
      <Link to="/vehicles">
        Find Your Ride <ArrowRight size={15} />
      </Link>
    </div>
  );
}
