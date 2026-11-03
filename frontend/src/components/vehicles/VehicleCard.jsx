
import { Link } from "react-router-dom";
import {
  Heart,
  Fuel,
  Gauge,
  Users,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

import { applyImageFallback } from "../../config/imageConfig.js";
import { useSavedVehicles } from "../../hooks/useSavedVehicles";
import { Status } from "../common/StatusBadge.jsx";
import { money } from "../../utils/formatters.js";

import "./VehicleCard.css";

export function VehicleCard({ vehicle: v, period }) {
  const { saved: storedIds, toggleSaved } = useSavedVehicles();

  const saved = storedIds.includes(v.id);

  const detailUrl = `/vehicles/${v.slug}`;

  const params = new URLSearchParams({
    vehicle: v.id,
    ...period,
  });

  const unavailable =
    v.available === false ||
    (!period &&
      [
        "Maintenance",
        "Inactive",
        "Rented",
        "Overdue",
        "Inspection",
      ].includes(v.physicalStatus));

  const statusValue = unavailable
    ? v.physicalStatus === "Available"
      ? "Reserved"
      : v.physicalStatus
    : "Available";

  const bookingUrl = unavailable
    ? detailUrl
    : `/checkout?${params.toString()}`;

  return (
    <article className="vehicle-card">

      {/* IMAGE SECTION */}
      <div className="vehicle-image">
        <Link
          to={detailUrl}
          className="vehicle-image__link"
          aria-label={`View ${v.name} details`}
        >
          <img
            src={v.image}
            alt={`${v.name} — illustrative image`}
            loading="lazy"
            decoding="async"
            onError={applyImageFallback}
          />
        </Link>

        {/* Subtle glass overlay */}
        <div
          className="vehicle-image__glass"
          aria-hidden="true"
        />

        {/* Category badge */}
        <span className="vehicle-tag">
          <Sparkles size={11} />
          {v.category}
        </span>

        {/* Favorite */}
        <button
          type="button"
          className={`favorite ${saved ? "saved" : ""}`}
          onClick={() => toggleSaved(v.id)}
          aria-label={`${saved ? "Unsave" : "Save"} ${v.name}`}
          aria-pressed={saved}
        >
          <Heart
            size={18}
            strokeWidth={2}
            fill={saved ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* CARD CONTENT */}
      <div className="vehicle-info">

        {/* Vehicle name */}
        <Link
          to={detailUrl}
          className="vehicle-title-link"
        >
          <h3>{v.name}</h3>
          <ArrowUpRight
            className="vehicle-title-arrow"
            size={16}
            aria-hidden="true"
          />
        </Link>

        {/* Specifications */}
        <div className="specs">
          <span>
            <Fuel size={13} />
            {v.fuel}
          </span>

          <span>
            <Gauge size={13} />
            {v.transmission}
          </span>

          <span>
            <Users size={13} />
            {v.seats} seats
          </span>
        </div>

        {/* Availability */}
        <div className="vehicle-availability">
          <Status value={statusValue} />
        </div>

        {/* Price and CTA */}
        <div className="vehicle-bottom">
          <p className="vehicle-price">
            {money(v.rate)}
            <span> / hour</span>
          </p>

          <Link
            className="rr-button vehicle-book-button"
            to={bookingUrl}
          >
            <span>
              {unavailable ? "View Details" : "Book Now"}
            </span>

            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Details link */}
        <Link
          className="vehicle-detail-link"
          to={detailUrl}
        >
          View specifications
          <ArrowUpRight size={13} />
        </Link>

      </div>
    </article>
  );
}
