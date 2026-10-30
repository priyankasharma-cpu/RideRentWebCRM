import { Logo } from '../common/Logo.jsx';
import { CallLink } from '../common/CallLink.jsx';
import { Link } from 'react-router-dom';
import './Footer.css';
export function Footer() {
  return (
    <footer className="customer-footer">
      <div className="container footer-top">
        <Logo />
        <p>Every journey deserves a great ride.</p>
        <CallLink />
      </div>
      <div className="container footer-links">
        <Link to="/my-bookings">Find my booking</Link>
        <Link to="/faq">FAQs</Link>
        <Link to="/privacy-policy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/admin">Admin panel</Link>
        <span>© {new Date().getFullYear()} RideRent · Demo fleet & illustrative photos</span>
      </div>
    </footer>
  );
}
