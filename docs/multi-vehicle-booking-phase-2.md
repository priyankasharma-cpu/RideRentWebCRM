# Phase 2 — Booking cart and review UI

Implemented on 5 November 2026. This phase implements the customer-facing selection UI. It does not implement grouped booking persistence, customer OTP login, or a new payment flow. Those remain Phases 3–6 of the architecture plan.

## Open the page

Visit `/booking`, or choose **Plan a multi-vehicle booking** on `/vehicles`. Optional `vehicle`, `startsAt` and `endsAt` query parameters initialize a selection. Existing `/checkout?vehicle=...` links and single-vehicle booking remain available.

The page includes a shared IST schedule, category/search selector, real inventory quantity controls, removable cart, add-on availability messaging, required full name/mobile/email, Rental Policy acceptance, editable review and itemized server-derived rental estimates. One-vehicle review can continue to the original checkout. Contact details are not copied to URL parameters or saved in browser storage; the existing checkout collects them through its normal form.

## Inventory and quantity behavior

Existing API Vehicle IDs represent physical vehicles. `groupBookingVehicles()` groups multiple units only when the API explicitly supplies the same `modelId`. Without modelId, each physical record remains its own selectable unit. Similar display names never manufacture quantity. Current production/preview data has no model mapping yet, so individual units normally have a maximum quantity of one.

`cartLines()` derives provisional available physical units. `updateCartQuantity()` prevents increases beyond available units or the client UI maximum, removes a line at zero, and still allows reducing an unavailable quantity. Inventory can change after a quote; the UI disables review when a selected quantity is no longer available. Only Phase 3 will allocate inventory atomically and reserve it.

A model quantity of two is supported and tested using explicit test-only model metadata attached to two existing seeded physical records. Test metadata/photos are not written to the actual fleet database.

## Schedule and estimates

The page uses existing PeriodFields, useVehicles, rentalTime utilities, bookingService.quote and `/api/quote`. Default and applied dates are shop-local IST. Requests use ISO UTC. Draft input changes disable selection/review and clear the old visible estimate until Check availability applies them. Checking unchanged dates also refreshes server inventory. Invalid/past requested windows produce errors; an applied schedule becoming past cannot crash React rendering.

`useCartQuotes()` requests one existing backend quote per provisional physical unit. Rate/deposit changes create a fresh quote key. It sums returned integer-paise base, tax, deposit and total, and rejects inconsistent billing rules or invalid amounts. It does not calculate authoritative rental prices from browser rates. Deposits remain separately displayed. This combined estimate is not a reserved group quote, and the backend must revalidate the entire selection together in Phase 3.

The cart and applied schedule are stored in sessionStorage under `rr-booking-cart-v1` for refresh/back navigation. Customer name/phone/email and acceptance are not stored there. Storage failures do not prevent using the page. Malformed saved data and invalid saved dates are handled safely.

## Add-ons and confirmation boundaries

Additional helmets are shown for eligible bikes/scooters and marked inapplicable for car-only selections. Helmet prices, included quantities, stock and limits were not supplied or configured in the current backend. The quantity control is therefore intentionally disabled; no invented price or charge is included in estimates.

The multi-vehicle Confirm button is intentionally disabled and no grouped reservation success is displayed. The review offers a shop call action. Once Phase 3 provides transactional group quote/create and a configured add-on catalog, this boundary can be replaced with the real submission flow. Do not loop over the old single-booking endpoint to imitate an atomic group booking.

## File map

New page: `frontend/src/pages/Booking.jsx`, `Booking.css`.

New booking components (each JSX/CSS pair):

- `QuantityControl`: accessible plus/minus controls.
- `RentalSchedule`: shared existing date inputs and apply action.
- `VehicleSelector`: category/search presentation and per-model/asset quantity.
- `BookingCart`: selected quantities, removal and inventory conflicts.
- `AddOnsSelector`: category-aware unconfigured helmet controls.
- `CustomerDetails`: controlled required contact form and policy checkbox.
- `BookingPriceSummary`: individual quote lines and combined paise totals.
- `BookingReview`: customer/schedule/vehicle review, edit and original checkout handoff.

New hooks: `frontend/src/hooks/useBookingCart.js`, `useCartQuotes.js`.
New utility/config: `frontend/src/utils/bookingCart.js`, `frontend/src/config/bookingConfig.js`.
New unit coverage: `frontend/tests/bookingCart.test.js`.

Existing integration changes: `frontend/src/routes.jsx` adds lazy `/booking`; `pages/Vehicles.jsx` adds the entry link and `Vehicles.css` styles that link only. No existing checkout source, admin, backend source, schemas, migrations or vehicle images are changed.

## Manual editing

- Page width/sidebar/gaps: `.group-booking`, `.group-booking__layout`, `.group-booking__panel` in Booking.css.
- Selector cards and image dimensions: `.vehicle-selector__grid`, `.vehicle-selector__vehicle`, `.vehicle-selector__vehicle > img` in VehicleSelector.css.
- Quantity controls: QuantityControl.css.
- Date row/layout: RentalSchedule.css; underlying shared PeriodFields is intentionally unchanged.
- Contact form: CustomerDetails.jsx/.css.
- Summary labels/spacing: BookingPriceSummary.jsx/.css. Change prices in the backend/fleet settings, not this component.
- Category labels/UI safeguard/storage key: bookingConfig.js. `maxVehiclesPerCart` is only a client safeguard and must not replace future backend limits.
- Add-on copy: bookingConfig.addOns. Its null pricing/limits document missing configuration; setting UI values alone does not implement backend add-on charging.
- Themes: all new CSS uses existing semantic color/border/surface tokens; no second theme provider or new dependency was added.

## Verification

Commands: `node --test frontend/tests/bookingCart.test.js`, `npm run build`, `npm run lint`.

Five unit tests cover model identity/duplicate IDs, inventory limits/removal, URL-selected model transition, exact quote aggregation and IST/date validation. The isolated browser scenario at `backend/.artifacts/booking-phase-2/verify.mjs` uses a disposable database and the real API for availability/quotes. It covers mixed cart, explicit same-model quantities, real totals, form validation, review/edit, stale-date invalidation, reload persistence without stored contact details, lost inventory, removal, car-only/unconfigured add-ons, original checkout, quote error and no booking writes. It also checks 1440/1024/768/390/320px in light/dark themes.

Backend integration tests were not rerun for this frontend-only phase; no backend behavior changed. No grouped booking, OTP delivery, add-on charge or multi-vehicle success is claimed implemented.

## Next phase

Implement the reviewed migration-history reconciliation and transactional BookingGroup/BookingItem backend with immutable prices. Then wire group quotes/creation and configured add-ons before enabling confirmation. Preserve existing operational booking, rental, receipt and deposit workflows.
