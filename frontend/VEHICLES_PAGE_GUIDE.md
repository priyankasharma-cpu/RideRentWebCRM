# RideRent Vehicles Page Developer Guide

This guide describes the actual `/vehicles` implementation. The page uses the database-backed API, not a frontend mock array. Development preview may use a copied SQLite database; its records can differ from the agency database. Never reset or seed an existing database to change vehicle content.

## A. Connected files

Paths below are relative to the project root.

### Frontend

- `frontend/src/routes.jsx`: lazy-loads `pages/Vehicles.jsx` for `/vehicles`; also registers `/vehicles/:slug` and `/checkout`.
- `frontend/src/pages/Vehicles.jsx`: composes the date form, sidebar, toolbar, loading/error/empty states and cards.
- `frontend/src/pages/Vehicles.css`: listing-only layout and card overrides; never changes homepage card styling.
- `frontend/src/hooks/useVehicleListing.js`: owns filter state, sorting, draft dates, URL updates and applied rental period.
- `frontend/src/config/vehicleFilterConfig.js`: filter options, rupee slider limits, reset defaults and five sort options.
- `frontend/src/utils/vehicleFilters.js`: `filterVehicles`, `sortVehicles`, `activeVehicleFilters`.
- `frontend/src/components/vehicles/VehicleFilters.jsx` and `.css`: labelled controls inside native, keyboard-accessible collapsible `<details>`.
- `frontend/src/components/vehicles/VehicleToolbar.jsx` and `.css`: actual filtered count, sorting, removable chips and Clear all.
- `frontend/src/components/vehicles/VehicleCard.jsx` and `.css`: shared card, category, image, save button, specs, status, hourly rate and links. Also used by `components/home/PopularVehicles.jsx`; its base styles were intentionally preserved.
- `frontend/src/hooks/useVehicles.js`: `useVehicles(query)` uses React Query, an AbortSignal, a query key including the period and the configured polling interval.
- `frontend/src/services/vehicleService.js`: `vehicleService.list(query, signal)` and `get(identifier, signal)`.
- `frontend/src/services/apiClient.js`: `api()` prefixes `/api`, sends same-origin cookies, parses JSON and reports errors. Mutations load the CSRF session.
- `frontend/src/components/booking/PeriodFields.jsx`, `PeriodFields.css`, `AvailabilitySearch.css`: shared pickup/return inputs and search styling.
- `frontend/src/utils/rentalTime.js`: `periodFromParams`, `defaultPeriod`, `shopInput`, `toUTC`; the shop timezone is Asia/Kolkata.
- `frontend/src/utils/formatters.js`: `money()` converts paise to formatted rupees.
- `frontend/src/hooks/useSavedVehicles.js`: favorite IDs in localStorage key `rr-saved`; same-tab and cross-tab subscriptions.
- `frontend/src/config/imageConfig.js`: `applyImageFallback()` substitutes the configured local fallback once if an image fails.
- `frontend/src/components/common/StatusBadge.jsx`, `Loader.jsx`, `ErrorBox.jsx`: shared feedback components.
- `frontend/src/components/layout/CustomerLayout.jsx`: Header, route outlet, Footer and MobileCallBar; unchanged.
- `frontend/src/pages/VehicleDetails.jsx` and `Checkout.jsx`: destinations of specifications and booking links; unchanged.
- `frontend/src/styles/globals.css`, `variables.css`, `light-theme.css`, `dark-theme.css`: reset, fonts, layers and existing theme tokens.
- `frontend/src/components/common/Page.css`, `Button.css`: shared container/page and button design.
- `frontend/src/context/ThemeContext.jsx`: existing persisted theme; unchanged.
- `frontend/src/config/siteConfig.js`: React Query polling interval.
- `frontend/vite.config.js`: development `/api` and upload proxy; `API_PROXY_URL` can override the API proxy target.

### Backend and database

- `backend/src/server.js`: calls `openDb()` and starts `createApp()`.
- `backend/src/app.js`: mounts vehicle and upload routers, middleware and uploaded image serving.
- `backend/src/config/env.js`: reads `backend/.env`; validates HOST, PORT, DB_PATH, DATABASE_URL, APP_ORIGIN and NODE_ENV. Do not expose secrets in frontend code.
- `backend/src/config/databasePath.js`: chooses DATABASE_URL if supplied, otherwise DB_PATH (default `backend/data/riderent.sqlite`).
- `backend/src/config/paths.js`: absolute project and upload paths.
- `backend/src/config/database.js`: Prisma SQLite adapter, query helpers, transactions and integer normalization for JSON. Existing repository SQL is executed through these helpers; it is not an all-Prisma-model-query implementation.
- `backend/prisma/schema.prisma`: relational `Vehicle` model mapped to table `vehicles`; bookings and maintenance relationships. Migrations are in `backend/prisma/migrations/`.
- `backend/src/modules/vehicles/vehicle.routes.js`: `createVehiclesRouter()` registers public and admin endpoints.
- `backend/src/modules/vehicles/vehicle.controller.js`: `listPublicVehiclesController()` and other handlers call services and return JSON.
- `backend/src/modules/vehicles/vehicle.service.js`: `listPublicVehicles`, `getPublicVehicle`, `listManagedVehicles`, `addVehicle`, `editVehicle`.
- `backend/src/modules/vehicles/vehicle.repository.js`: `listVehicleRecords()` excludes Inactive records and runs `ORDER BY name`; add/edit/query helpers.
- `backend/src/modules/vehicles/vehicle.presenter.js`: `vehicleViews()` derives physical status, date availability and compatibility fields.
- `backend/src/modules/vehicles/vehicleState.repository.js`: reservation, unresolved maintenance and rental-count queries for the presenter.
- `backend/src/modules/vehicles/vehicle.validation.js`: Zod add/edit boundaries (categories, fuel, transmission, numeric limits and image path).
- `backend/src/modules/availability/rentalWindow.service.js`: `rentalWindow()` validates chronological order, future pickup and maximum duration; reads shop settings.
- `backend/src/modules/availability/availability.validation.js`: ISO datetime/window schema.
- `backend/src/modules/availability/availability.rules.js`: `assessAvailability()` and `physicalVehicleStatus()`.
- `backend/src/modules/availability/availability.service.js` and `availability.repository.js`: reusable booking-time availability and related queries.
- `backend/src/modules/settings/settings.service.js`: shop rental-window policy used by validation.
- `backend/src/modules/uploads/upload.routes.js`, `upload.controller.js`, `upload.middleware.js`, `upload.service.js`, `upload.static.js`: protected upload endpoint, 4 MiB file limit, JPEG/PNG/WebP signature checking, returned `/images/uploads/...` URL and static serving. Actual uploads live under the configured backend upload directory; bundled images live under `frontend/public/images/`.
- `backend/src/middleware/authorize.js`, `validateRequest.js`: admin authorization and schema validation; app-level authentication/CSRF protections remain unchanged.
- `backend/src/modules/audit/audit.service.js`: vehicle changes are audited. Maintenance changes also use `modules/maintenance/serviceRecord.service.js`.
- `frontend/src/admin/pages/VehicleManagement.jsx`, `.css`, `frontend/src/admin/features/vehicles/VehicleEditor.jsx`, `.css`, `frontend/src/admin/hooks/useAdminAction.js`: existing fleet editing UI and mutation feedback.
- `backend/tests/integration/rental.test.js` and `backend/tests/e2e/{run,workflow,layout}.mjs`: existing API and isolated browser regression coverage.

## B. How data loads

1. A stored `Vehicle` record is read from `vehicles` by `listVehicleRecords(db, 'Inactive')`.
2. `listPublicVehicles()` calls `vehicleViews()`. The presenter reads reservations and service blocks, computes status and optionally calls `assessAvailability()` for a requested period.
3. `listPublicVehiclesController()` returns this array from `GET /api/vehicles`.
4. Vite forwards the frontend `/api` request to the API in development. `api()` parses JSON; `vehicleService.list()` returns it.
5. `useVehicles()` keeps this server state in React Query. A different date query gets a different cache key; filters do not change the API request.
6. `Vehicles()` calls `filterVehicles(data, filters, hasRentalPeriod)` and `sortVehicles()`. It passes each resulting record to the shared `VehicleCard`, with the applied period.

The record supplies `id`, `slug`, `name`, `category`, `image`, `fuel`, `transmission`, `seats`, `rate` and stored `status`. `physicalStatus` is derived from stored status, maintenance and current reservations. `available` and `reason` are supplied only for date-window requests. The presenter also supplies `rentalCount`, `type`, `price`, `detail` and `trans` compatibility fields. Rental count is not used as a recommendation rank.

There is no pagination. Backend listing supports optional `category`, `q`, `available=true`, `startsAt`, `endsAt`. This UI sends dates and performs all six user-facing filters locally on that array. Backend filtering exists for other callers; it is not required for each sidebar change.

## C. Filters

All values live in ONE `filters` object in `useVehicleListing()`. `VehicleFilters` receives it with `updateFilter(key, value)` and `resetFilters()`; it has no duplicate filter state. `filterVehicles()` applies every filter with AND.

- Search: `filters.query`; case-insensitive name substring after trimming. Edit the placeholder in VehicleFilters.jsx. Backend has optional `q`, but this UI searches locally.
- Category: `filters.category`; exact category or All. Edit `vehicleFilterConfig.categories`. This value also updates only the category URL parameter, preserving dates.
- Transmission: `filters.trans`; edit `vehicleFilterConfig.transmissions`; local exact match.
- Fuel: `filters.fuel`; edit `vehicleFilterConfig.fuels`; local exact match.
- Price: `filters.max` in rupees/hour. Edit `vehicleFilterConfig.price` for min/max/step and the matching default. `v.rate <= filters.max * 100` compares paise correctly.
- Available only: `filters.onlyAvailable`; with applied dates, requires API `available === true`. Without dates, requires `physicalStatus === 'Available'`. Current physical status alone cannot prove future availability.

`activeVehicleFilters()` builds chips. Removing one resets just that key to `defaultVehicleFilters[key]`. Reset/Clear all restore all six defaults, not the selected rental dates or sort order. Reset removes category from the URL but leaves the date parameters intact.

## D. Sorting

Edit labels/values in `vehicleSortOptions`, comparisons in `sortVehicles()`. Low/high compare integer paise; A–Z/Z–A use name locale comparison. `sortVehicles()` copies the array before sorting.

**Recommended is a compatibility label, not an algorithm.** No backend recommendation score exists. It preserves API order, which currently comes from SQL `ORDER BY name`. This remains deterministic without claiming an inferred ranking.

## E. UI editing

All listing overrides are namespaced under `.vehicles-page` in `pages/Vehicles.css`, so homepage cards retain their current appearance.

- Image height: `--listing-image-height` on `.vehicles-page` (250px desktop, 240px below 1250px).
- Containment: `.vehicles-page .vehicle-image img` sets `object-fit: contain; object-position: center`. Its link fills the parent. Listing hover zoom is disabled. CSS cannot restore parts already cropped in the source file.
- Card width/columns: `.vehicles-page .listing-grid` uses three columns above 1250px, two through 601–1250px, one at 600px and below. Change these breakpoints or column templates deliberately.
- Sidebar width: `--listing-sidebar-width` (275px, 265px on narrower desktop); layout stacks below 850px.
- Grid spacing: `--listing-gap`, `.vehicles-page .listing-layout` gap.
- Card typography/padding: `.vehicle-info`, `.vehicle-info h3`, `.specs`, `.vehicle-bottom` rules inside Vehicles.css. Flex growth, reserved heading/spec space and `margin-top: auto` align card CTAs.
- Booking button: `.vehicles-page .vehicle-bottom .rr-button` controls listing sizing; the existing common Button.css defines its colors. To change ONLY listing colors, add the background/color on this listing selector, not the shared button.
- Sidebar controls: VehicleFilters.css; title/search/options markup in VehicleFilters.jsx.
- Toolbar and chips: VehicleToolbar.css and VehicleToolbar.jsx.
- Themes: reuse `--color-background`, `--color-surface`, `--color-surface-muted`, `--color-text`, `--color-muted`, `--color-primary`, `--color-border`, `--shadow-card`. Global token changes affect every page; listing-only changes belong on `.vehicles-page`.
- Mobile: filters use native `<details>`; tap or keyboard-activate its heading to collapse/expand. Controls remain in one column below 500px. No JavaScript drawer or extra library is needed.

## F. Add a filter (example: minimum seats)

1. Add `minSeats: 1` to `defaultVehicleFilters` in vehicleFilterConfig.js.
2. Add a labelled number input or select in VehicleFilters.jsx with `value={filters.minSeats}` and `onChange={e => onChange('minSeats', Number(e.target.value))}`. Reuse `.vehicle-filters__field`.
3. Add `v.seats >= filters.minSeats` to the AND predicates in filterVehicles(). Seats already exists in the API; no backend modification is necessary.
4. Add a chip in activeVehicleFilters() when minSeats exceeds 1. Reset will include the new default automatically.
5. Test search+category+seats together and remove the seats chip. For a field absent from the API, inspect its backend model and contract before designing a migration.

## G. Update vehicle records

Use the existing admin Vehicle Management page and VehicleEditor. Admin GET `/api/admin/vehicles` lists the fleet including inactive records. Authorized POST `/api/admin/vehicles` creates; PUT `/api/admin/vehicles/:id` edits. Validated services update SQLite transactionally, enforce existing fleet/maintenance/booking restrictions and write audit records.

Enter rates and deposits in **rupees** in VehicleEditor: submit multiplies by 100 and rounds to integer paise. Database Vehicle.rate/deposit are BigInt minor units; API normalizes them to safe JSON numbers. `money(v.rate)` divides by 100 for display. Presenter `price` is a legacy rupee field; listing filters/cards use authoritative `rate` in paise. Example: database/API 10000 means ₹100/hour; slider 100 means ₹100; limit comparison is 10000 <= 100 * 100.

Use existing admin upload to update an image URL, or provide a validated local `/images/...` or HTTPS path. This redesign does not edit vehicle records or overwrite images. Public assets should be placed inside frontend/public/images; backend uploads are served at /images/uploads. React Query polling refreshes returned records.

## H. Rental period and availability

Draft dates live in `period`. Applied dates come from `startsAt` and `endsAt` in the URL, after validation. `PeriodFields` edits only drafts. `search()` validates return-after-pickup, updates URL dates and turns on Available only. `toUTC()` converts shop-local input (+05:30) to ISO UTC for GET `/api/vehicles?startsAt=...&endsAt=...`.

Backend rentalWindow() additionally checks future pickup and shop maximum duration. assessAvailability() rejects inactive/maintenance vehicles, unresolved active maintenance, active/inspection rentals, overlapping confirmed bookings and overlapping service blocks. Overlap uses start < otherEnd and end > otherStart; adjacent reservations are allowed. Physical status can also be Reserved, Rented, Overdue or Inspection.

Filters, sorting and clear-all preserve applied dates. Cards receive the applied period, not unsubmitted draft inputs; Book Now passes vehicle ID plus startsAt/endsAt into `/checkout`. Unavailable cards route to details. Authoritative quote/pricing and overlap/concurrency enforcement remain on the backend booking service. A listing result is not a reservation guarantee.

## I. Troubleshooting

- **Server unavailable:** run `npm run dev` from the root to start API and Vite. Confirm `/api/vehicles` returns JSON. Check port 3001, backend logs and Vite proxy; another app on localhost may differ from 127.0.0.1. Never run setup/reset against an existing database as a connectivity fix.
- **No results:** remove chips/reset filters. Price defaults cap results at ₹1000/hour as before. Future expensive vehicles may require increasing the configured slider maximum.
- **Wrong period:** inspect URL and click Check Availability after editing draft dates. Read the backend error for past or too-long windows.
- **Vehicle available now but not for dates:** this is expected when a confirmed reservation or maintenance overlaps. Do not bypass the API flag.
- **Image blank:** inspect record image URL, HTTP response and fallback in imageConfig.js. `contain` avoids display cropping but cannot undo a cropped source photograph.
- **Recommended looks alphabetical:** current backend API order is alphabetical; no recommendation ranking exists. Use explicit Name options or design a real backend ranking separately.
- **Style accidentally affects homepage:** scope custom selectors under `.vehicles-page`; do not change shared VehicleCard.css for listing-only adjustments.
- **Favorites disappear:** check localStorage `rr-saved` and browser privacy/storage settings. Saved IDs are browser-local, not customer-account database data.

## Development and verification

From the project root: `npm run dev`, `npm run build`, `npm run lint`, `npm test`, `npm run test:ui`. Existing test runners use disposable SQLite files, not agency records. Browser test artifacts for this redesign are under `backend/.artifacts/vehicles-redesign/`. Do not run database setup/seed just to launch the page.

## Verification results for this redesign

- Frontend build, ESLint and formatting passed.
- All 22 existing backend integration tests passed against disposable databases.
- Listing browser checks passed for every category/transmission/fuel option, price, availability, search/empty state, chips/reset, all five sorting modes, favorite persistence, details and checkout navigation, applied-date preservation and malformed URL dates.
- 1440, 1024, 768, 390 and 320px passed in both themes: no horizontal overflow, 3/2/1 grid columns and 240–250px `contain` image areas. All 21 current preview images loaded.
- Original `npm run test:ui` passed customer booking/admin/payment/rental checks but then stopped at a pre-existing stale navbar selector (`Toggle navigation`; current button is `Open navigation`). An artifact copy changing only that selector completed the entire isolated workflow, including mobile navigation and all shared routes. Product header and original test source were not modified.
- No backend source, database records, vehicle image files, header, footer or homepage source was changed. Source hash comparison confirmed the scope.
