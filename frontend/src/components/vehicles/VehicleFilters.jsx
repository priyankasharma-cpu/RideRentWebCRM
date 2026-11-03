
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  CarFront,
  Gauge,
  Fuel,
  IndianRupee,
  CheckCircle2,
  Sparkles,
  X,
  Bike,
  Zap,
} from "lucide-react";

import { vehicleFilterConfig } from "../../config/vehicleFilterConfig.js";
import "./VehicleFilters.css";

const categoryIcons = {
  All: CarFront,
  Bike: Bike,
  Scooter: Zap,
  Car: CarFront,
};

export function VehicleFilters({ filters, onChange, onReset }) {
  const priceConfig = vehicleFilterConfig.price;

  const priceProgress =
    ((filters.max - priceConfig.min) /
      (priceConfig.max - priceConfig.min || 1)) *
    100;

  return (
    <aside className="vehicle-filters" aria-label="Vehicle filters">
      <details className="vehicle-filters__panel" open>
        {/* Header */}
        <summary className="vehicle-filters__heading">
          <span className="vehicle-filters__heading-icon">
            <SlidersHorizontal size={20} />
          </span>

          <span className="vehicle-filters__heading-text">
            <strong>Find Your Perfect Ride</strong>
            <small>Personalize your search</small>
          </span>

          <ChevronDown
            className="vehicle-filters__chevron"
            size={18}
            aria-hidden="true"
          />
        </summary>

        <div className="vehicle-filters__body">
          {/* Search */}
          <div className="vehicle-filters__group">
            <label
              className="vehicle-filters__label"
              htmlFor="vehicle-model-search"
            >
              <Search size={15} />
              Search by model
            </label>

            <div className="vehicle-filters__input-wrap">
              <Search
                className="vehicle-filters__input-icon"
                size={17}
                aria-hidden="true"
              />

              <input
                id="vehicle-model-search"
                type="search"
                placeholder="Honda, Yamaha, Toyota..."
                value={filters.query}
                onChange={(e) => onChange("query", e.target.value)}
              />

              {filters.query && (
                <button
                  type="button"
                  className="vehicle-filters__input-clear"
                  aria-label="Clear search"
                  onClick={() => onChange("query", "")}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="vehicle-filters__group">
            <div className="vehicle-filters__label">
              <CarFront size={15} />
              Vehicle Category
            </div>

            <div
              className="vehicle-filters__categories"
              role="group"
              aria-label="Vehicle category"
            >
              {vehicleFilterConfig.categories.map((category) => {
                const Icon = categoryIcons[category] || CarFront;

                return (
                  <button
                    key={category}
                    type="button"
                    className={`vehicle-filters__category ${filters.category === category ? "is-active" : ""
                      }`}
                    aria-pressed={filters.category === category}
                    onClick={() => onChange("category", category)}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    <span>{category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transmission */}
          <div className="vehicle-filters__group">
            <label
              className="vehicle-filters__label"
              htmlFor="vehicle-transmission"
            >
              <Gauge size={15} />
              Transmission
            </label>

            <div className="vehicle-filters__select-wrap">
              <Gauge size={17} className="vehicle-filters__select-icon" />

              <select
                id="vehicle-transmission"
                value={filters.trans}
                onChange={(e) => onChange("trans", e.target.value)}
              >
                {vehicleFilterConfig.transmissions.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All Transmissions" : item}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="vehicle-filters__select-chevron"
              />
            </div>
          </div>

          {/* Fuel */}
          <div className="vehicle-filters__group">
            <label className="vehicle-filters__label" htmlFor="vehicle-fuel">
              <Fuel size={15} />
              Fuel Type
            </label>

            <div className="vehicle-filters__select-wrap">
              <Fuel size={17} className="vehicle-filters__select-icon" />

              <select
                id="vehicle-fuel"
                value={filters.fuel}
                onChange={(e) => onChange("fuel", e.target.value)}
              >
                {vehicleFilterConfig.fuels.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All Fuel Types" : item}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="vehicle-filters__select-chevron"
              />
            </div>
          </div>

          {/* Price */}
          <div className="vehicle-filters__group vehicle-filters__price">
            <div className="vehicle-filters__price-heading">
              <label
                className="vehicle-filters__label"
                htmlFor="vehicle-price"
              >
                <IndianRupee size={15} />
                Maximum Hourly Price
              </label>

              <span className="vehicle-filters__price-value">
                ₹{filters.max}
              </span>
            </div>

            <input
              id="vehicle-price"
              type="range"
              min={priceConfig.min}
              max={priceConfig.max}
              step={priceConfig.step}
              value={filters.max}
              onChange={(e) => onChange("max", Number(e.target.value))}
              style={{ "--range-progress": `${priceProgress}%` }}
            />

            <div className="vehicle-filters__price-limits">
              <span>₹{priceConfig.min}</span>
              <span>₹{priceConfig.max} / hr</span>
            </div>
          </div>

          {/* Availability */}
          <label className="vehicle-filters__availability">
            <span className="vehicle-filters__availability-content">
              <span className="vehicle-filters__availability-icon">
                <CheckCircle2 size={19} />
              </span>

              <span className="vehicle-filters__availability-text">
                <strong>Available Only</strong>
                <small>Show available rides</small>
              </span>
            </span>

            <input
              type="checkbox"
              checked={filters.onlyAvailable}
              onChange={(e) =>
                onChange("onlyAvailable", e.target.checked)
              }
            />

            <span className="vehicle-filters__switch" aria-hidden="true" />
          </label>

          {/* Reset */}
          <button
            type="button"
            className="vehicle-filters__reset"
            onClick={onReset}
          >
            <RotateCcw size={16} />
            <span>Reset All Filters</span>
          </button>

          <div className="vehicle-filters__footer">
            <Sparkles size={14} />
            <span>Find the right ride for every journey</span>
          </div>
        </div>
      </details>
    </aside>
  );
}
