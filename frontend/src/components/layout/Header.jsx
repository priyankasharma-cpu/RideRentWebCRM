import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, PhoneIncoming, X } from 'lucide-react';

import { navigationLinks } from '../../config/navigation.js';
import { getShopPhone } from '../../config/siteConfig.js';
import { useShop } from '../../context/ShopContext.jsx';
import { Logo } from '../common/Logo.jsx';
import { ThemeToggle } from '../common/ThemeToggle.jsx';

import './Header.css';

// Change this breakpoint if you add more navigation links.
const NAV_BREAKPOINT = 1240;

function useCompactNavigation() {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < NAV_BREAKPOINT : false,
  );

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${NAV_BREAKPOINT - 1}px)`);

    const update = () => setCompact(media.matches);

    update();
    media.addEventListener('change', update);

    return () => media.removeEventListener('change', update);
  }, []);

  return compact;
}

function HeaderCallLink({ phone }) {
  return (
    <a
      className="customer-header__call"
      href={`tel:${phone.tel}`}
      aria-label={`Call ${phone.display}${phone.placeholder ? ', demo number' : ''}`}
      title={phone.placeholder ? 'Demo number — update in shop settings' : 'Call the rental shop'}
    >
      <span className="customer-header__call-icon" aria-hidden="true">
        <PhoneIncoming size={20} />
      </span>

      <span className="customer-header__call-copy">
        <span className="customer-header__call-label">
          Call Now
          {phone.placeholder && <span className="customer-header__placeholder">Demo number</span>}
        </span>

        <strong>{phone.display}</strong>
      </span>
    </a>
  );
}

function HeaderNavigation({ onNavigate }) {
  return (
    <nav className="customer-header__navigation" aria-label="Primary navigation">
      {navigationLinks.map(({ label, path }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'customer-header__nav-active' : '')}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const compact = useCompactNavigation();

  const location = useLocation();
  const panelId = useId();

  const menuButtonRef = useRef(null);
  const panelRef = useRef(null);

  const { config } = useShop();
  const phone = getShopPhone(config);

  // Close the drawer after route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search, location.hash]);

  // Close the drawer when returning to desktop.
  useEffect(() => {
    if (!compact) setMenuOpen(false);
  }, [compact]);

  // Accessible mobile drawer.
  useEffect(() => {
    if (!compact || !menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;

    document.body.style.overflow = 'hidden';

    const focusFrame = requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector('.customer-header__drawer-close')
        ?.focus({ preventScroll: true });
    });

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        panelRef.current?.querySelectorAll('a[href], button:not([disabled])') || [],
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);

      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [compact, menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="customer-header" data-menu-open={compact && menuOpen}>
      <div className="customer-header__inner">
        {/* LEFT — LOGO */}
        <div className="customer-header__logo">
          <Logo />
        </div>

        {/* CENTER — NAVIGATION / MOBILE DRAWER */}
        <div
          ref={panelRef}
          id={panelId}
          className="customer-header__panel"
          role={compact ? 'dialog' : undefined}
          aria-modal={compact && menuOpen ? true : undefined}
          aria-label={compact ? 'RideRent navigation' : undefined}
          aria-hidden={compact && !menuOpen ? true : undefined}
          inert={compact && !menuOpen}
        >
          <div className="customer-header__drawer-heading">
            <span>Explore RideRent</span>

            <button
              type="button"
              className="customer-header__drawer-close"
              onClick={closeMenu}
              aria-label="Close navigation"
            >
              <X size={21} />
            </button>
          </div>

          <HeaderNavigation onNavigate={closeMenu} />

          <Link
            className="customer-header__booking customer-header__drawer-booking"
            to="/vehicles"
            onClick={closeMenu}
          >
            Book a Ride
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        {/* RIGHT — THEME / PHONE / BOOKING */}
        <div className="customer-header__actions">
          <div className="customer-header__theme">
            <ThemeToggle compact />
          </div>

          <HeaderCallLink phone={phone} />

          <Link
            className="customer-header__booking customer-header__desktop-booking"
            to="/vehicles"
          >
            Book a Ride
            <ArrowRight size={18} aria-hidden="true" />
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            className="customer-header__menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-controls={panelId}
            aria-expanded={compact && menuOpen}
            aria-haspopup={compact ? 'dialog' : undefined}
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      {/* MOBILE BACKDROP */}
      <button
        type="button"
        className="customer-header__backdrop"
        aria-label="Close navigation"
        tabIndex={compact && menuOpen ? 0 : -1}
        onClick={closeMenu}
      />
    </header>
  );
}
