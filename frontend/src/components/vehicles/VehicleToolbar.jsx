
import {
  ArrowDownUp,
  CheckCircle2,
  CalendarClock,
  CarFront,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import { vehicleSortOptions } from "../../config/vehicleFilterConfig.js";
import "./VehicleToolbar.css";

export function VehicleToolbar({
  count,
  loading,
  sort,
  onSort,
  chips = [],
  onRemove,
  onReset,
  hasRentalPeriod,
}) {
  return (
    <div className="vehicle-toolbar">
      <div className="vehicle-toolbar__top">
        {/* Results information */}
        <div className="vehicle-toolbar__results">
          <div className="vehicle-toolbar__icon">
            <CarFront size={23} strokeWidth={1.8} />
          </div>

          <div className="vehicle-toolbar__count">
            <div className="vehicle-toolbar__heading">
              <strong aria-live="polite" aria-atomic="true">
                {loading
                  ? "Finding your ride..."
                  : `${count} ${count === 1 ? "Ride" : "Rides"} to Explore`}
              </strong>

              {!loading && (
                <span className="vehicle-toolbar__live-dot" aria-hidden="true" />
              )}
            </div>

            <div className="vehicle-toolbar__subtitle">
              {hasRentalPeriod ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Availability checked for your dates</span>
                </>
              ) : (
                <>
                  <CalendarClock size={14} />
                  <span>Select dates to check availability</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sorting */}
        <div className="vehicle-toolbar__sort-area">
          <div className="vehicle-toolbar__sort-label">
            <ArrowDownUp size={15} />
            <span>Sort by</span>
          </div>

          <div className="vehicle-toolbar__select-wrap">
            <Sparkles
              className="vehicle-toolbar__select-icon"
              size={17}
              aria-hidden="true"
            />

            <select
              id="vehicle-sort"
              aria-label="Sort vehicles"
              value={sort}
              onChange={(e) => onSort(e.target.value)}
            >
              {vehicleSortOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <ChevronDown
              className="vehicle-toolbar__chevron"
              size={16}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Active filters */}
      {chips.length > 0 && (
        <div className="vehicle-toolbar__filter-row">
          <div className="vehicle-toolbar__filter-label">
            <SlidersHorizontal size={15} />
            <span>Active Filters</span>
            <span className="vehicle-toolbar__filter-count">
              {chips.length}
            </span>
          </div>

          <div className="vehicle-toolbar__chips" aria-label="Active filters">
            {chips.map(({ key, label }) => (
              <button
                type="button"
                className="vehicle-toolbar__chip"
                key={key}
                onClick={() => onRemove(key)}
                aria-label={`Remove filter: ${label}`}
              >
                <span>{label}</span>
                <X size={14} aria-hidden="true" />
              </button>
            ))}

            <button
              type="button"
              className="vehicle-toolbar__clear"
              onClick={onReset}
            >
              <RotateCcw size={14} />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
