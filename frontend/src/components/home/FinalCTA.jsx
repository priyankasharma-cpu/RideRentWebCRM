
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock3,
  PhoneIncoming,
} from "lucide-react";

import { homeContent } from "../../config/homeContent";
import { CallLink } from "../common/CallLink.jsx";

import "./FinalCTA.css";

export function FinalCTA({
  titleLead = homeContent.final.titleLead,
  titleAccent = homeContent.final.titleAccent,
  ctaLabel = homeContent.final.cta,
  contained = true,
}) {
  return (
    <section
      className={`final-cta-section ${contained ? "final-cta-section--contained" : ""
        }`}
      aria-label="Explore RideRent vehicles"
    >
      <div className="final-cta">
        {/* Decorative background */}
        <div className="final-cta__glow" aria-hidden="true" />
        <div className="final-cta__circle final-cta__circle--one" aria-hidden="true" />
        <div className="final-cta__circle final-cta__circle--two" aria-hidden="true" />

        <div className="final-cta__content">
          <span className="final-cta__eyebrow">
            <Sparkles size={15} aria-hidden="true" />
            YOUR NEXT JOURNEY STARTS HERE
          </span>

          <h2 className="final-cta__title">
            {titleLead}{" "}
            <em>{titleAccent}</em>
          </h2>

          <p className="final-cta__description">
            Discover your perfect ride from our collection
            of bikes, scooters and cars. Flexible rentals,
            easy booking and endless possibilities.
          </p>

          <div className="final-cta__actions">
            <Link
              className="final-cta__primary"
              to="/vehicles"
            >
              {ctaLabel}
              <ArrowRight size={19} aria-hidden="true" />
            </Link>

            <div className="final-cta__call">
              <span
                className="final-cta__call-icon"
                aria-hidden="true"
              >
                <PhoneIncoming size={19} />
              </span>

              <CallLink className="final-cta__call-link" />
            </div>
          </div>

          <div className="final-cta__features">
            <span>
              <ShieldCheck size={16} aria-hidden="true" />
              Transparent Pricing
            </span>

            <span>
              <Clock3 size={16} aria-hidden="true" />
              Flexible Hourly Rentals
            </span>
          </div>
        </div>

        <div className="final-cta__visual" aria-hidden="true">
          <div className="final-cta__visual-circle">
            <div className="final-cta__visual-inner">
              <span className="final-cta__visual-text">
                RIDE
                <strong>FREE</strong>
              </span>
            </div>
          </div>

          <div className="final-cta__road">
            <div className="final-cta__road-line" />
          </div>
        </div>
      </div>
    </section>
  );
}
