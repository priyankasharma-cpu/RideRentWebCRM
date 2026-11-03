
import { useId } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  LockKeyhole,
  PhoneIncoming,
  ShieldCheck,
  Clock3,
  MapPin,
} from "lucide-react";

import { Logo } from "../common/Logo.jsx";
import { useShop } from "../../context/ShopContext.jsx";
import { getShopPhone, siteConfig } from "../../config/siteConfig.js";
import {
  footerNavigation,
  footerUtilityLinks,
} from "../../config/footerNavigation.js";
import { getConfiguredSocialLinks } from "../../config/socialLinks.js";

import "./Footer.css";

// ============================================
// SOCIAL MEDIA
// Edit social profile URLs in config/socialLinks.js
// ============================================

function FooterSocialLinks() {
  const links = getConfiguredSocialLinks();

  if (links.length === 0) return null;

  return (
    <nav
      className="rr-footer__socials"
      aria-label={siteConfig.footer.socialLabel}
    >
      {links.map(({ id, label, icon: Icon, url }) => (
        <a
          key={id}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${siteConfig.name} on ${label}`}
          title={label}
        >
          <Icon size={20} aria-hidden="true" />
        </a>
      ))}
    </nav>
  );
}

// ============================================
// ANIMATED CALL CARD
// Phone is sourced from backend shop settings
// with a configured fallback.
// ============================================

function FooterPhoneCard({ phone }) {
  const { callLabel, demoLabel, contactPrompt } = siteConfig.footer;

  return (
    <div className="rr-footer__contact">
      <p className="rr-footer__contact-heading">
        {contactPrompt}
      </p>

      <a
        className="rr-footer__phone-card"
        href={`tel:${phone.tel}`}
        aria-label={`${callLabel} ${phone.display}${phone.placeholder ? ` — ${demoLabel}` : ""
          }`}
      >
        <span className="rr-footer__phone-icon" aria-hidden="true">
          <PhoneIncoming size={24} />
        </span>

        <span className="rr-footer__phone-info">
          <span className="rr-footer__phone-label">
            {callLabel}
          </span>

          <strong>{phone.display}</strong>

          {phone.placeholder && (
            <span className="rr-footer__demo-label">
              {demoLabel}
            </span>
          )}
        </span>

        <ArrowUpRight
          className="rr-footer__phone-arrow"
          size={20}
          aria-hidden="true"
        />
      </a>
    </div>
  );
}

// ============================================
// FOOTER NAVIGATION
// Edit links in config/footerNavigation.js
// ============================================

function FooterNavigation({ phone }) {
  const id = useId();

  return footerNavigation.map((group) => (
    <nav
      className="rr-footer__nav-column"
      key={group.id}
      aria-labelledby={`${id}-${group.id}`}
    >
      <h2 id={`${id}-${group.id}`}>{group.title}</h2>

      <ul>
        {group.links.map((item) => (
          <li key={item.path || item.type}>
            {item.type === "phone" ? (
              <a
                href={`tel:${phone.tel}`}
                aria-label={`${item.label} ${phone.display}${phone.placeholder
                    ? ` — ${siteConfig.footer.demoLabel}`
                    : ""
                  }`}
              >
                {item.label}
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            ) : (
              <Link to={item.path}>
                {item.label}
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  ));
}

// ============================================
// TRUST STRIP
// ============================================

const trustItems = [
  { label: "Transparent Rentals", Icon: ShieldCheck },
  { label: "Flexible Booking", Icon: Clock3 },
  { label: "Explore Your Way", Icon: MapPin },
];

function FooterTrustStrip() {
  return (
    <div className="rr-footer__trust">
      <div className="container rr-footer__trust-inner">
        {trustItems.map(({ label, Icon }) => (
          <div className="rr-footer__trust-item" key={label}>
            <span className="rr-footer__trust-icon">
              <Icon size={19} aria-hidden="true" />
            </span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN FOOTER
// ============================================

export function Footer() {
  const shop = useShop();
  const phone = getShopPhone(shop?.config);
  const content = siteConfig.footer;

  return (
    <footer
      id="site-footer"
      className="rr-footer"
      aria-label={`${siteConfig.name} footer`}
    >
      {/* MAIN FOOTER — No top CTA banner */}
      <div className="container rr-footer__main">
        <div className="rr-footer__brand">
          <div className="rr-footer__brand-logo">
            {/* Logo already handles navigation if linked internally */}
            <Logo />
          </div>

          <h2 className="rr-footer__tagline">
            {content.tagline}
          </h2>

          <p className="rr-footer__description">
            {content.description}
          </p>

          <FooterSocialLinks />

          <FooterPhoneCard phone={phone} />
        </div>

        <FooterNavigation phone={phone} />
      </div>

      <FooterTrustStrip />

      {/* COPYRIGHT BAR */}
      <div className="rr-footer__bottom">
        <div className="container rr-footer__bottom-inner">
          <p>
            © {new Date().getFullYear()}{" "}
            <strong>{siteConfig.name}</strong>.{" "}
            {content.copyright}
          </p>

          <div className="rr-footer__bottom-links">
            <span>{content.disclosure}</span>

            {footerUtilityLinks.map(({ label, path }) => (
              <Link key={path} to={path}>
                <LockKeyhole size={13} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
