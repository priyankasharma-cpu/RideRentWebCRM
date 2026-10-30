import { customerNavigation } from '../../config/navigation';
import { useState, useEffect } from 'react';
import { useLocation, NavLink, Link } from 'react-router-dom';
import { Logo } from '../common/Logo.jsx';
import { ThemeToggle } from '../common/ThemeToggle.jsx';
import { CallLink } from '../common/CallLink.jsx';
import { ArrowRight, X, Menu } from 'lucide-react';
import './Header.css';
export function Header() {
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  return (
    <header className="customer-header">
      <div className="nav-wrap">
        <Logo />
        <nav className={menu ? 'open' : ''}>
          {customerNavigation.map(([name, url]) => (
            <NavLink to={url} end={url === '/'} key={url} onClick={() => setMenu(false)}>
              {name}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <CallLink className="phone">Call Now</CallLink>
          <Link className="rr-button nav-book" to="/vehicles">
            Book a Ride <ArrowRight size={15} />
          </Link>
          <button
            className="mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-label="Toggle navigation"
            aria-expanded={menu}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
