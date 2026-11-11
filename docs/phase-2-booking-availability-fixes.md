# Phase 2 — first booking and availability fix batch

Date: 5 November 2026 (India time). Project: `E:/piyasharmawebwork/MyDemoprojects/RideRentwebCRM`.

## Scope and implementation

This batch fixes the agreed date, quote freshness, zero-stock selection and listing-state issues. Prisma + SQLite, existing schemas, API contracts, inventory transactions and saved production records are preserved. No OTP, model migration, add-on migration, dependency installation or pricing-policy rewrite was performed.

### 1. Rental dates remain shareable and consistent

`utils/rentalTime.js` now provides shared rental-period parsing/validation and URL serialization. Valid UTC URL timestamps normalize into India-local datetime inputs; existing local URL conventions remain supported. Partial, impossible, reversed and past dates are rejected before availability requests. The backend continues to enforce its authoritative maximum-duration/billing rules.

`hooks/useRentalPeriod.js` makes the URL the source of truth for detail and checkout dates. Default schedules are written once using replace navigation; explicit edits create ordinary browser history entries. Refresh/back/forward read the current URL rather than stale component state. No new global date context was introduced.

All VehicleCard detail links (image, title, specifications and unavailable CTA) retain the selected period. VehicleDetails retains it in the back-to-listing link and checkout link. Listing validation uses the same helper. Its existing Check Availability action still applies a draft schedule; until the applied schedule matches and a successful check completes, the cards cannot claim verified availability.

### 2. Cached successful quotes cannot keep booking enabled after failure

`hooks/useFreshQuote.js` centralizes debouncing and freshness for the detail/manual single-unit quote hook and checkout quote hook. The request payload is serialized into the query key and passed to the request function as that snapshot. AbortSignal is forwarded to the existing API client. Changing dates, vehicle IDs, normalized quantities or helmets immediately makes the old result unusable, before the debounce expires.

A usable quote requires enabled/valid inputs, no debounce mismatch, a successful query state and no active fetch. Cached data is hidden during a refresh and after errors. Responses for an older input key cannot replace the current quote. Detail/checkout show explicit errors and retry actions; invalid dates do not expose a retry action that would send invalid requests.

Checkout additionally requires a successful fresh stock catalogue and positive verified quantity for every selected row. Catalogue failure/loading cannot enable the previous quote. Retrying checkout refreshes stock, then the quote observer fetches the current selection again.

The existing backend still recalculates prices and allocation inside its transaction immediately before reservation. This batch does not replace server-side protections with browser checks.

### 3. Zero-stock selections are honest and bounded

URL-selected checkout vehicles start as an unresolved selection (`quantity: null`), not an assumed physical unit. `utils/checkoutSelections.js` derives the displayed/submitted quantities only from verified backend stock. Unverified, missing and zero-stock units display quantity 0; an available initial selection may select one after the stock check succeeds. Existing quantities are bounded by the verified available count.

Zero-stock rows explicitly show Currently Unavailable / 0 available; increment and confirmation are disabled. Removing the unavailable selection or changing dates can recover the cart. Pending/error catalogue state uses checking/retry text rather than claiming there are no vehicles. Submission contains only the verified normalized item quantities and remains disabled while any selected row is unavailable.

Backend regression assertions and a direct isolated HTTP attempt verify a zero-stock reservation returns 409 and creates no additional booking row.

### 4. Vehicle listing availability semantics

Shared VehicleCard now distinguishes unknown, checking, error, available-for-selected-dates and currently-unavailable states. Book Now appears only when a successful date-specific check verifies availability. Otherwise the action is View Details, with the period preserved when available.

The listing passes explicit request/fetch/error state so stale retained API data cannot be treated as a new availability confirmation. Its existing design, images, spacing and favourite/detail actions are retained. Shared date-free cards, including homepage cards, also use the neutral state and View Details because they have no verified rental interval.

**Fleet-count limitation intentionally deferred:** current records identify physical vehicles, with only inferred checkout grouping and no stable model ID. No fake model totals, available-model counts or guessed fleet migration were introduced. Cards remain physical-unit cards. Full model totals/aggregate counts require the separately reviewed model/unit migration. Existing backend checkout counts remain the authority for its current matching-group quantity limits.

## Regression coverage

New `frontend/tests/rentalAvailability.test.js` covers local/UTC URL round-trips, date validation including impossible dates, zero/unverified-stock initialization, missing units and quantity clamping. Existing frontend cart tests remain in place.

New `backend/tests/e2e/availability.mjs` uses a disposable SQLite database and temporary accounts/fixture inventory. It verifies:

- Neutral date-free listing and no misleading Book Now action.
- Listing -> details -> checkout period preservation.
- Refresh and browser back/forward schedule behavior.
- Zero-stock row quantity 0, disabled increment/confirmation and recovery after changing dates.
- Direct backend 409 rejection with no booking-row increase.
- Unavailable listing action preserves the selected dates on View Details.
- Cached-success then quote-503 failure disables detail action and hides the old price breakdown; retry recovers.
- Rapid date changes with a deliberately delayed older response delivered after the newer response; the newer quote remains displayed.
- Invalid dates do not trigger quote/catalogue requests.
- Checkout quote outage/retry, immediate quantity/add-on invalidation, real stock limits.
- Actual single-unit and mixed three-vehicle reservations.
- Responsive listing checks at 1440/1024/768/390/320 in both themes, without horizontal overflow or runtime page errors.

`backend/tests/integration/checkout.test.js` adds zero-stock quote/reservation rejection and no-partial-write assertions inside the existing regression suite.

The outdated mobile menu selector in `backend/tests/e2e/workflow.mjs` now uses the intentional Open navigation label. The same test's theme initialization is limited to the application main frame/origin: injecting localStorage access into external map frames produced a harness SecurityError once the old selector no longer stopped the suite. This correction does not suppress application errors or change production theme behavior.

## Modified and created files

Created:

- `frontend/src/hooks/useRentalPeriod.js`
- `frontend/src/hooks/useFreshQuote.js`
- `frontend/src/utils/checkoutSelections.js`
- `frontend/tests/rentalAvailability.test.js`
- `backend/tests/e2e/availability.mjs`
- This implementation report.

Functional modifications:

- `frontend/src/utils/rentalTime.js`
- `frontend/src/hooks/useQuote.js`
- `frontend/src/hooks/useCheckout.js`
- `frontend/src/hooks/useVehicleListing.js`
- `frontend/src/hooks/useVehicles.js`
- `frontend/src/pages/VehicleDetails.jsx`
- `frontend/src/pages/Checkout.jsx`
- `frontend/src/pages/Vehicles.jsx`
- `frontend/src/components/vehicles/VehicleCard.jsx`
- `frontend/src/components/booking/CheckoutVehicles.jsx`
- `backend/tests/integration/checkout.test.js`
- `backend/tests/e2e/workflow.mjs`

Formatting-only cleanup, explicitly requested in this batch:

- `frontend/src/components/common/Logo.css`
- `frontend/src/components/home/FinalCTA.css`
- `frontend/src/components/home/FinalCTA.jsx`
- `frontend/src/components/layout/Footer.css`
- `frontend/src/components/layout/Footer.jsx`
- `frontend/src/components/vehicles/VehicleCard.css`
- `frontend/src/components/vehicles/VehicleFilters.css`
- `frontend/src/components/vehicles/VehicleFilters.jsx`
- `frontend/src/components/vehicles/VehicleToolbar.css`
- `frontend/src/components/vehicles/VehicleToolbar.jsx`
- `README.md`

VehicleCard.jsx was also formatted alongside its scoped functional fix. No files were deleted. No backend production module, schema, migration, image asset or environment configuration was changed.

## Commands and evidence

Commands executed for this batch:

```text
npm run lint
npm run build
npm run format:check
npm test
node --test frontend/tests/*.test.js
node backend/tests/e2e/availability.mjs
npm run test:ui
npm run test:layout
node backend/tests/e2e/admin-addons.mjs
```

Evidence directory: `backend/.artifacts/availability-fixes/`. Named logs: `lint.log`, `build.log`, `format.log`, `backend-tests.log`, `frontend-tests.log`, `browser-regression.log`, `workflow.log`, `layout.log`, `admin-ui.log`. New browser screenshots are `listing-<width>-<theme>.png`; these contain test data, not production inventory.

Backend suite: 43/43 passed. Frontend unit suite: 10/10 passed. New availability browser regression passed; Admin Add-ons browser regression passed; existing layout checks passed. Final workflow/hygiene results are recorded in the accompanying final verification status below.

## Remaining limitations and next-phase boundaries

- Stable VehicleModel / physical-unit mapping and aggregate fleet counts remain deferred; no numbers were invented.
- Existing technical checkout request caps remain unchanged. They are not a limit on how many actual fleet records can be stored.
- Legacy/manual booking generic add-on parity, authenticated customer/OTP flows, independent equipment lifecycle, and expanded pricing/rule snapshots remain separate audit findings, outside this batch.
- No browser booking action guarantees stock until the backend transaction succeeds. A different customer can take the last unit after a displayed quote; the server remains authoritative and rejects conflicts.
- Existing error payloads remain compatible `{error}` strings. Structured stock-conflict response redesign is not needed for these guarded/refetching UI fixes and was not introduced.
- Tests use installed desktop Microsoft Edge at responsive viewport sizes. Real Android/iOS devices, production load and disaster recovery were not tested in this batch.

## Final verification status

- **PASS — ESLint:** frontend/backend source and test checks. The browser-only test initializer uses globalThis references so it also satisfies the Node-oriented E2E lint configuration.
- **PASS — frontend production build.**
- **PASS — repository-wide format check:** all 12 previously flagged files resolved; other changes also follow Prettier.
- **PASS — backend integration suite:** 43 tests, including zero-stock rejection and unchanged row count after a rejected attempt.
- **PASS — frontend unit suite:** 10 tests.
- **PASS — new availability browser regression:** completed on the updated build, including unavailable stock, preserved URL history, quote failure/retry, older responses, invalid-date guards and real single/multi-vehicle creation.
- **PASS — existing full workflow:** customer booking/confirmation, Admin licence/payment/pickup/return/inspection/refund, manual booking/cancellation, lookup and mobile navigation. The prior selector and cross-origin test-initializer failures are resolved.
- **PASS — existing layout suite:** home, fleet, detail and Admin views at 1440/1024/768/390.
- **PASS — Admin Add-ons browser suite:** persistence, live customer quote updates, role restrictions and editor/page responsiveness through 320px in both themes.
- **PASS — real database safety verification:** agency and preview business-table hashes match the Phase-1 audit baseline; zero foreign-key violations. Evidence: `backend/.artifacts/availability-fixes/database-verification.json`.

No unresolved failure remains in the executed first-batch checks. The remaining model/inventory/authentication features listed above were not implemented or claimed complete.
