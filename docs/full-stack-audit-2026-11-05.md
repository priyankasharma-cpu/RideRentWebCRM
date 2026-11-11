# RideRent full-stack audit — Phase 1 findings

Reviewed 5 November 2026, India time. Workspace: `E:/piyasharmawebwork/MyDemoprojects/RideRentwebCRM`.

**Assessment: not ready to call the complete requested platform production-ready.** Core per-physical-vehicle reservation concurrency and financial-ledger tests pass, but catalogue identity, frontend availability state, unified booking/add-on allocation and customer authentication have confirmed gaps. No confirmed critical double-allocation exploit was found in the executed tests; this is not proof that every possible race or production deployment is safe.

This turn performs inspection, isolated tests and reporting only. Application source, migrations and real business rows were not changed. The pasted attachment repeats the audit request and is treated as the user's task. Fixes have deliberately not begun before this findings report.

## 1. Actual architecture and storage

The actual stack is React 19, Vite, React Router, TanStack React Query, Express 5, Prisma 7.10.1 and SQLite through `@prisma/adapter-better-sqlite3`. There is no MongoDB connector, Mongoose schema, MongoDB replica-set deployment or MongoDB transaction implementation in this repository. References to MongoDB in the requested architecture are requirements, not evidence of an existing MongoDB system.

Root has `frontend/`, `backend/`, `docs/`, shared scripts/package manifest, ESLint/Prettier configuration, README and Git metadata. No root `data/`, `output/` or `node_modules/` was present in this inspection. Frontend dependencies are in frontend; backend/server dependencies are in backend. Root npm scripts orchestrate both.

Frontend entry: `frontend/src/main.jsx` -> `App.jsx` -> `context/AppProviders.jsx` -> `routes.jsx`. Shared customer layout provides Header/Footer; protected Admin routes use `admin/routes.jsx` -> `admin/layouts/AdminLayout.jsx`.

Backend entry: `backend/src/server.js` -> `backend/src/config/database.js` and `backend/src/app.js`. The app attaches request IDs, Helmet headers, JSON parser, cookies, API rate limits, session authentication, CSRF, staff/Admin guards and feature routers. Routers call controllers/services/repositories; bound SQL and Prisma graph queries coexist.

Schema/migrations: `backend/prisma/schema.prisma`, `backend/prisma/migrations/0001_baseline` through `0007_dynamic_addons`. Core models: Vehicle, Booking, BookingContact, Customer, Rental, RentalInspection, Payment, Refund, MaintenanceBlock, User, Session, AuditLog, ShopSettings. Added models: VehicleImage, ContactInquiry, CheckoutOrder/CheckoutItem, legacy BookingAddon and generic AddOn/AddOnCategory/AddOnAllocation.

No stable VehicleModel or customer account/OTP model exists.

### Databases inspected read-only

- Agency `backend/data/riderent.sqlite`: 13 application tables including sessions; 20 physical vehicle rows, 12 bookings.
- Preview `backend/.artifacts/preview/riderent.sqlite`: 20 application tables including sessions; 21 physical vehicle rows, 17 bookings at the audit snapshot.
- Both: `integrity_check = ok`, zero foreign-key violations, zero overlapping confirmed booking pairs, zero invalid vehicle money rows and zero reversed booking windows in the checks executed.
- Agency lacks optional gallery/contact/checkout/add-on upgrade tables. Preview has contact/checkout/add-ons but lacks `vehicle_images`.
- Neither has `_prisma_migrations`. The default backend .env points at agency storage; the separately launched local preview has used a database override. Starting the same source with a different database can therefore produce feature-dependent failures.
- Pre/post hashes of existing business tables, excluding the operational session table, matched during this audit. Neither real database was seeded, reset or migrated.

Evidence: `backend/.artifacts/full-audit/database-before.json`, `database-verification.json`. Table names/counts, not customer information or credentials, are reported.

## 2. Dependency and feature integration map

**Vehicle discovery:** `pages/Vehicles.jsx` -> `hooks/useVehicleListing.js` + `hooks/useVehicles.js` -> `services/vehicleService.js` -> `services/apiClient.js` -> GET `/api/vehicles` -> `modules/vehicles/vehicle.routes.js` -> controller -> `listPublicVehicles()` -> vehicle repository/presenter -> vehicle state/availability repositories -> vehicles/bookings/maintenance/images. Browser filtering/sorting is in `utils/vehicleFilters.js` and `config/vehicleFilterConfig.js`; sorting recommendation preserves API order, not an ML recommendation algorithm.

**Vehicle details:** `pages/VehicleDetails.jsx` -> `useVehicle(slug)` -> GET `/api/vehicles/:slug` -> `getPublicVehicle()` -> unit lookup and presenter. `useQuote()` separately calls POST `/api/quote` -> `quoteBooking()` -> `rentalWindow()`, `price()` and `availability()`. `components/vehicles/VehicleGallery.jsx` supports optional real gallery records and fallback imagery. The detail page is still a physical-unit view, not a fleet/model view.

**Website checkout:** `pages/Checkout.jsx` -> `hooks/useCheckout.js` -> GET `/api/checkout/catalog` and POST `/api/checkout/quote` -> `checkout.service.js` -> inferred grouping of physical units + existing vehicle availability + `addons/addOn.pricing.js` -> server totals. Confirmation posts `/api/checkout/reserve`, revalidates stock/quote, opens one SQLite transaction, invokes core `createBooking()` for each allocated physical unit, and stores checkout membership plus add-on snapshots. `BookingConfirmation.jsx` and `PriceBreakdown.jsx` display child ledgers and combined checkout reference links.

**Legacy/manual booking:** `admin/pages/CreateBooking.jsx` + `useQuote()` -> POST `/api/admin/bookings` -> `reserveManualBooking()` -> `createBooking()`. POST `/api/bookings` is also still public. These paths enforce vehicle availability but bypass generic add-on allocation and do not offer multi-item entry. They do not currently share the complete checkout operation.

**Customer access:** `pages/MyBookings.jsx` -> POST `/api/bookings/lookup` -> reference + normalized phone lookup -> new booking token -> `services/bookingTokens.js` -> GET `/api/bookings/:id`. `Login.jsx` and `Profile.jsx` redirect here. This is a reference lookup portal, not customer login/OTP/session/history authentication.

**Admin fleet:** `admin/pages/VehicleManagement.jsx` -> `features/vehicles/VehicleEditor.jsx` -> `/api/admin/vehicles` -> vehicle validation/service/repository. Each registration identifies one physical unit. Admin edits prices/deposits/status and uploads a primary image. Multi-image backend API exists, but a full reorder/remove/primary gallery editor is not implemented.

**Admin helmets/add-ons:** `admin/pages/HelmetManagement.jsx` reuses `AddOnManagement.jsx` -> `features/addons/AddOnEditor.jsx` -> `services/addOnService.js` -> `/api/admin/addons` -> add-on validation/service/repository -> definitions/categories/allocations. Rate, billing, stock, unavailable stock, quantity cap, eligibility and included units persist. Card inventory is conservative peak-future/active-rental summary, not independent issue/return equipment events.

**Pickup/return/payments:** booking manager -> `/api/admin/bookings/:id/pickup|return|complete|payments` -> rental/payment services -> transactions -> inspections, actual timestamps, ledger receipts and refunds. Refunds are admin-only; ordinary staff may carry out operational rental/payment actions. Booking/customer verification is driving-licence verification, not phone OTP.

**Settings/dashboard/contact:** ShopContext and Admin Settings -> settings API/ShopSettings JSON; Admin dashboard -> analytics service -> rental receipt and booking views; ContactForm -> contactService -> `/api/contact` -> idempotent inquiry persistence -> admin inbox. Email delivery of contact inquiries is not implemented by the storage endpoint.

Detailed 47-route API inventory and observations are in `docs/full-stack-api-inventory.md`. Static frontend call sites and relative import edges are saved under the audit artifact directory.

## 3. Confirmed bugs and requirement gaps, ranked

### Critical

**None confirmed in executed reservation tests.** The backend rejected unavailable reservations and tested simultaneous requests did not create duplicate physical allocations. Do not mislabel the visible quantity-1 problem as proven database overselling.

### High

**H1 — No stable vehicle model / physical unit relationship.**

Affected: `backend/prisma/schema.prisma`; `modules/bookings/checkout.service.js` (`modelKey()`); `modules/vehicles/vehicle.service.js`, `vehicle.presenter.js`; frontend Vehicles/VehicleDetails/VehicleCard and Admin VehicleEditor.

Evidence: API exposes physical unit rows, no modelId/totalFleet contract. Two identical test units initially group together; editing one rate splits them into two inferred groups. Display names/specs/rates are mutable and cannot serve as permanent model identity. Listings can show duplicate model cards and cannot report model totals reliably. Proposed fix: additive VehicleModel + explicit physical-unit modelId mapping, preserve every existing unit/booking ID, review ambiguous mappings instead of fuzzy merging.

**H2 — Website/manual/legacy booking paths do not share add-on commitments.**

Affected: `modules/bookings/booking.service.js`, `checkout.service.js`, `modules/addons/addOn.pricing.js`, `frontend/src/admin/pages/CreateBooking.jsx`.

Evidence: with one helmet and one included helmet per eligible vehicle configured, POST `/api/bookings` accepted an eligible bike (201) with zero add-on snapshots; catalogue still reported that helmet available, and a different checkout allocated it. This proves inconsistent configured-inclusion enforcement. It does not prove every physical helmet was actually handed out, because equipment issue is not implemented. Fix: one authoritative quote/reservation core for website, legacy and phone/walk-in paths, including included and paid inventory; preserve staff source/licence semantics.

**H3 — Selected rental period is discarded when navigating listing to details.**

Affected: `components/vehicles/VehicleCard.jsx`, `pages/VehicleDetails.jsx`, `utils/rentalTime.js`.

Evidence: an unavailable unit for the chosen future window links to `/vehicles/<slug>` without dates. Detail page initializes `defaultPeriod()` rather than the selected URL period. The browser then shows a bookable quote for different dates. Fix: carry the selected dates through details links and initialize/reset detail schedule from validated query parameters. Recheck backend availability on every period change.

**H4 — Failed detail quote refresh can leave an active booking CTA.**

Affected: `hooks/useQuote.js`, `pages/VehicleDetails.jsx`, `services/queryClient.js`.

Evidence: after a successful quote was cached, SPA navigation back to the same detail query with a simulated 503 displayed an error while `Book This Ride` retained `aria-disabled="false"`. `useQuote()` exposes `query.data` without suppressing it on fetch error/in-flight stale refresh. Backend revalidation still protects final reservation. Fix: model pending/success/error/stale states explicitly and disable actions unless the current-period quote is successfully authoritative.

**H5 — Customer ownership authentication is not implemented as requested.**

Affected: `pages/Login.jsx`, `Profile.jsx`, `MyBookings.jsx`, `context/AuthContext.jsx`, `modules/bookings/booking.service.js` (`lookupBooking()`), `bookingAccess.service.js`, session/schema modules.

Evidence: known reference + matching phone returns 200 and a bearer token without OTP or an authenticated customer account. The issued token reads details (200); a wrong token returns 403. Thus random-ID access is protected, but possession/knowledge of reference + phone can grant access without contact verification. References contain random entropy and lookup is rate-limited; unrestricted reference brute-force success was not demonstrated. Fix: verified customer ownership/session or a separately approved secure claim flow; keep staff and customer principals separate. SMS/email provider delivery is BLOCKED until an actual provider/configuration is supplied.

**H6 — Database/schema deployment drift blocks a reliable rollout.**

Affected: `config/databasePath.js`, `config/env.js`, `backend/scripts/baseline.mjs`, migrations and deployment docs.

Evidence: agency/preview contain different optional tables; migration history is absent. `baseline.mjs` requires exactly 13 tables, then compares complete snapshots including table keys after deploying all migrations. New tables can make the post-check fail despite valid additive changes; preview already fails its initial fixed-table assumption. Fix: explicit target selection, backup, drift assessment and reviewed migration baseline/reconciliation; compare pre-existing business rows separately from intended schema additions. No reset or blind seed.

### Medium

**M1 — Zero-stock checkout still displays quantity 1.** `pages/Checkout.jsx` initializes URL selection to quantity 1; `CheckoutVehicles.jsx` retains it when availability becomes zero. Reproduced row: `0 available` with output `1`. Confirm button was disabled and server quote returned 409. Fix: keep an explicit unavailable selection state, require removal/change of dates or quantity normalization, and never imply a reserved unit exists.

**M2 — Unknown availability is incorrectly labeled Available.** `VehicleCard.jsx` falls back to `Available` on date-free data. Reproduced `/vehicles` card displays Available and Book Now without a date-checked availability result. `physicalStatus` must not stand in for requested-period availability. Add neutral unknown/loading/error states and model counts only from backend data.

**M3 — Conflict payload omits refreshed stock.** `checkout.service.js` fails with 409 text; `middleware/errorHandler.js` emits only `{error}`; `services/apiClient.js` throws away status/structured data. Reproduced response keys: `["error"]`, no updated availability. Checkout separately refetches, but does not meet the requested conflict contract. Return a typed conflict with relevant model counts and retain typed client errors.

**M4 — Hardcoded checkout caps conflict with configurable/unlimited-growth requirements.** `checkout.validation.js`, `checkout.service.js`, `CheckoutVehicles.jsx` impose 50 vehicles/model rows/cart quantities; the unused legacy planner has a separate 10-unit cap in bookingConfig. Distinguish a request-size safety boundary from admin-configured business limits. Fleet storage itself is not capped at 50. Implement explicit pagination/batching rather than simply removing all abuse/resource limits.

**M5 — Mandatory email/policy acceptance does not match the new specification.** BookingForm labels email optional; booking validation accepts empty/missing email (an isolated successful booking omitted it). Agreement links to `/terms`, not the requested explicit Rental Policy acceptance. Confirm intended policy text and make frontend/backend requirements agree without rewriting historical customer records.

**M6 — Customer flow has no distinct booking preview or authenticated dashboard.** Active checkout directly submits confirmation. Old BookingReview components are unreferenced; `/booking` redirects to checkout. Confirmation and My Bookings work as retrieval UI, but are not the requested preview/account/history flow.

**M7 — Generic add-ons are configured in Admin/API but not selectable in customer checkout.** Checkout state submits items + helmets only. The generic addOns backend contract works in tests, but no current customer picker submits arbitrary add-on selections. Included units may be auto-reserved; optional paid generic extras require a UI.

**M8 — Independent equipment and shared-order lifecycle are incomplete.** Add-on stock is derived from owning booking status, paid units are assigned to the first eligible child's ledger, and included units attach to eligible children. There are no independent/partial equipment issue/return events or explicit shared-equipment order cancellation policies. Audit did not simulate real physical handover. Design allocation lifecycle before claiming exact issued stock.

**M9 — Historical commercial amounts are preserved, but all operational rules are not snapshotted.** `pricing.service.js`, `rentalWindow.service.js`, `rental.service.js` read current settings. Rescheduling preserves rate/deposit but recalculates tax using current taxBps; return grace uses current lateGraceMinutes. Existing unchanged bookings retain stored money; rule changes during reschedule/return need an explicit agreed policy/version snapshot. Code finding; exhaustive rule-change scenarios NOT TESTED in this audit.

**M10 — Growing query/CPU work has a measured justification for optimization.** Checkout catalogue performed 72 SQL queries for 21 physical units in an isolated fixture (~32ms, not a production load benchmark). `inventory()` calls availability per unit; booking reads scan all checkout members/add-on snapshots and repeatedly filter them. Admin customers loads all booking graphs. Add model/period aggregation, targeted queries and pagination; measure again at realistic fleet/history sizes.

### Low

**L1 — Verification tooling is not green.** `npm run test:ui` fails at an obsolete exact `Toggle navigation` label; source header now uses a different label. Logs show customer booking and staff rental/payment/manual flows passed before the selector failure. Fix the test selector after report delivery; do not label the entire workflow suite PASS.

**L2 — Formatting and style maintenance.** `npm run format:check` reports 12 files, including recently user-edited layout/listing files and README. No bulk formatter was run. Some scoped CSS files are large: Header 675 lines, VehicleCard 625, VehicleFilters 571, Footer 571. Size is a maintainability signal, not proof every rule is duplicate. Review conflicting selectors before editing.

**L3 — Unreferenced candidates and unused dependency.** Import graph found ten candidates including useBookingCart/useCartQuotes, old planner sections and VehicleSprite. The old planner subtree uses obsolete configuration. `framer-motion` is declared but no source import was found. Recharts is used and is not an unused dependency. Do not delete candidates blindly; check exports, styles, tests and public asset references first.

## 4. Booking, inventory and pricing results that did pass

Existing availability uses `existingStart < requestedEnd && existingEnd > requestedStart` for confirmed reservations and maintenance windows. Active/inspecting rentals block until explicit return/inspection, including overdue rentals. Started unresolved maintenance conservatively blocks until explicitly resolved. Inactive units cannot be reserved. Adjacent intervals are allowed. Cancellation releases the relevant reservation window.

SQLite reservations acquire a database write lock before availability reads through `transaction()` in `config/database.js`; the JS write queue is not the only protection. Tests include concurrent website/manual reservations and independent Prisma connections. Group checkout allocates actual distinct physical IDs in one transaction and rolls back partial failures. No MongoDB transaction behavior was tested because there is no MongoDB deployment here. Multi-process/multi-host production load/failover tests remain NOT TESTED.

Money is integer paise in DB/API/calculations and rupees for input/display. Tax uses basis points; rental duration rounds according to configured billing blocks. Backend quotes/reservations recalculate vehicle and add-on charges. Stored rates/base/tax/deposit and add-on snapshots survive price edits. Included add-on units consume stock; peak overlap avoids summing adjacent equipment reservations. Staff receipts, outstanding balances, rental/deposit separation and eligible refunds are covered by tests. Online payment gateway/settlement is NOT IMPLEMENTED; offline pay-at-shop remains the current behavior.

## 5. Frontend and Admin audit summary

No broken relative imports were found by static resolution; build and lint passed. Static route/code traces show shared providers and customer/Admin layouts are coherent. Registered Admin routes include dashboard, fleet, bookings, pickup/return lists, customers, payments, maintenance, analytics, settings, staff, inquiries and new Helmets/Add-ons screens.

Admin vehicle CRUD, status safety, licence verification, ordinary payment/pickup/return, refunds, settings and add-on controls have executed regression coverage. Dedicated stable model creation/unit assignment and model-level total/available counts are missing. Admin CreateBooking remains single-unit and cannot select generic extras. Images have an optional five-image server contract but the main fleet editor remains primary-image oriented.

Theme uses one context/localStorage system and semantic CSS tokens. Layout browser tests passed 1440/1024/768/390 for home/listing/detail and Admin views; Helmets/Add-ons page/editor passed 1440/1024/768/390/320 in both themes, including keyboard Escape/focus restoration. This does not certify every page, Android/iOS browser or assistive-technology combination. Full WCAG assessment, physical Android/iOS testing and exhaustive animation profiling are NOT TESTED.

Contact submission, private admin inquiry inbox and image API input boundaries have integration tests. External map uptime, real phone/email deliverability, image licence ownership and production asset CDN behavior are NOT VERIFIED by these tests.

## 6. Security and environment findings

Positive evidence: HTTP-only session cookies; Secure in production mode; SameSite=Lax; hashed session tokens; scrypt password hashing; active-user checks; session invalidation tests; request CSRF token and origin checks; protected Admin router; additional admin-only fleet/settings/add-on/refund/staff/audit boundaries; bound SQL; Zod request validation; upload signature/type/size checks; generic 500 messages; request IDs without logging contact-message bodies/credentials.

An isolated HTTP sweep confirmed 401 for unauthenticated access to all 31 registered Admin method/route combinations. Admin/staff restriction tests passed. This checks denial behavior, not every successful payload for every endpoint. Wrong booking token returned 403; reference + phone ownership remains the H5 gap.

Environment variable names were inspected without reporting values. Configuration supports DB_PATH/DATABASE_URL, port/host/origins and production mode; no MongoDB URI or OTP provider configuration is wired into the schema/services. Vite proxies API to localhost:3001 and uploaded images separately; differing IPv4/IPv6 or API_PROXY_URL/storage targets should be verified on deployment. Runtime production HTTPS, reverse-proxy trust, distributed limiter store, backup restore and host/file permissions are NOT VERIFIED. Do not infer production hardening from local passing tests.

## 7. Test ledger and evidence

- **PASS:** `npm run lint` (frontend and backend ESLint), `lint.log`.
- **PASS:** `npm run build`, `build.log`.
- **PASS:** explicit Node syntax checks of 126 backend JS/MJS files, `syntax.json`.
- **PASS:** `npm test`: 43/43 integration tests, `backend-tests.log`.
- **PASS:** `node --test frontend/tests/*.test.js`: 5/5, `frontend-tests.log`.
- **FAIL:** `npm run format:check`: 12 files, `format.log`.
- **FAIL:** `npm run test:ui`: stale Toggle navigation selector after successful customer/admin/manual flow checkpoints, `workflow.log`.
- **PASS:** `npm run test:layout`: desktop/sidebar/mobile/tablet layout checks, `layout.log`.
- **PASS:** `node backend/tests/e2e/admin-addons.mjs`: real Admin saves, exact paise, reloads, customer quote updates, archive, stale-edit handling, role restrictions and responsive themes, `admin-ui.log`.
- **PASS (reproduction harness):** isolated audit probes for H1/H2/H3/H4/H5 and M1/M2/M3 plus physical-API contract and guest guards, `probes.json`, `probes.log`, `guest-admin-auth.json`. A reproduced product bug is a failed requirement, not a passing product feature.
- **PASS:** both real database integrity/foreign-key/money/window checks and unchanged business row hashes, `database-verification.json`.
- **BLOCKED:** customer OTP/provider delivery and real customer-account end-to-end authentication: not implemented/configured.
- **NOT TESTED:** MongoDB, live production payments, real phone/email delivery, production-scale load, failover/crash recovery, physical Android/iOS, every model/archive scenario after a future schema change and every successful API boundary permutation.

The completed traced rerun also passed 43/43 tests. Together with 12 additional isolated HTTP smoke cases, every one of the 47 registered method/path combinations has at least one observed successful response. This does not verify all payload/permission permutations. The HTTP-response tracer collects method/path/status only (no credentials or payloads); per-endpoint observations are documented separately. One secondary trace attempt was interrupted by renewed user input and is not counted as a complete suite run.

## 8. Prioritized safe fix plan

1. Preserve this baseline/evidence. Reconcile the intended database target and migration history on a backup copy. Keep all real physical IDs, booking references, payments/refunds and snapshots intact.
2. Fix confirmed customer-facing availability bugs first: selected-period propagation, explicit unknown/loading/error/success quote states, no active CTA after quote error, and honest zero-stock selection state. Return structured 409 stock conflicts. Add regression tests using the reproduced cases before changing their implementations.
3. Introduce stable VehicleModel -> PhysicalVehicleUnit mapping additively. Review existing unit grouping, especially variants/rates; do not manufacture inventory or infer stock from a quantity field. Backend returns model total/available/unavailable counts. Update listing/detail/checkout/Admin counts together.
4. Unify public/legacy/manual/multi-item booking orchestration around the same pricing and allocation transaction; preserve staff/customer trust boundaries. Included/paid equipment reservations must use the same core service on every creation path. Retain offline ledger behavior.
5. Resolve customer account/ownership specification and integrate a real verified claim/session flow. Do not simulate OTP success. Align mandatory fields and actual Rental Policy acceptance frontend/backend, and add a clear preview.
6. Define equipment issue/partial-return/cancellation lifecycle and stable pricing/rule snapshots. Then complete generic customer add-on picker, manual multi-item Admin booking and appropriate inventory reports.
7. Repair the obsolete UI test selector and scoped formatting, retire verified dead planner code, paginate targeted queries and replace measured N+1 work. Repeat concurrency, pricing, ownership, layout and migration-rollback tests for each increment.

The user explicitly requested findings before source modification; no implementation patch is applied in this Phase-1 audit. The first fix increment should address items 1–2 above, followed by stable model allocation and shared booking service, rather than a one-shot rewrite.

## 9. Audit deliverables and source-change verification

Created documentation: this report and `docs/full-stack-api-inventory.md`.

Created ignored evidence/probe files: `backend/.artifacts/full-audit/` (static maps, snapshots/hashes, logs, isolated probe/trace/syntax helpers and screenshot). Helpers never target real databases for writes.

No pre-existing frontend/backend source changed: `source-verification.json` reports an empty changed list across 416 inspected source/test/style files. Build artifacts were regenerated by the requested build; operational test screenshots/logs were generated. No production record, secret or credential is included in this report.
