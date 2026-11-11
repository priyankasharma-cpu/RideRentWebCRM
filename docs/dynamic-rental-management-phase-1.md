# RideRent dynamic rental management — Phase 1 inspection and approval plan

Reviewed: 5 November 2026. Status: inspection complete; the new dynamic Admin implementation has NOT started. This is a development plan, not a claim that the requested platform is complete.

## 1. What is actually running

The repository is React 19 + Vite + JavaScript, Express 5, Prisma 7.10.1 and SQLite. There is no MongoDB connection, MongoDB driver, Mongoose schema or customer OTP dashboard in the current implementation. `backend/prisma/schema.prisma` declares `provider = "sqlite"`; `backend/src/config/database.js` creates a PrismaBetterSqlite3 adapter.

The current local API on port 3001 matches the preview database inventory, not the agency database:

- `backend/data/riderent.sqlite`: 13 business tables, 20 vehicles, 12 bookings. Inspected read-only; no schema/data changes in this work.
- `backend/.artifacts/preview/riderent.sqlite`: 17 business tables, 21 vehicles, 13 bookings after the additive checkout migration. It has the contact inquiry table and the new checkout tables, but not the optional vehicle gallery table. Existing rows were hash-compared before/after migration and remained unchanged.
- Neither database has `_prisma_migrations`. Automatic deployment or resetting is unsafe until migration history is reconciled.
- Preview backup: `backend/.artifacts/preview/riderent-before-checkout-20261105-134534.sqlite`.

## 2. Reusable implementation and actual gaps

### Vehicles and physical fleet

`frontend/src/admin/pages/VehicleManagement.jsx` and `frontend/src/admin/features/vehicles/VehicleEditor.jsx` already edit vehicle name, brand, category, registration, rate, deposit, fuel, transmission, seats, engine, image, description, odometer and status.

Backend files: `backend/src/modules/vehicles/vehicle.routes.js`, `vehicle.controller.js`, `vehicle.service.js`, `vehicle.repository.js`, `vehicle.validation.js`, `vehicle.presenter.js`, `vehicleState.repository.js`.

Existing APIs: GET `/api/vehicles`, GET `/api/vehicles/:slug`, GET `/api/admin/vehicles`, POST `/api/admin/vehicles`, PUT `/api/admin/vehicles/:id`. Fleet writes require the admin role; all `/api/admin` APIs require a staff session.

A Vehicle row is already one physical vehicle with a unique registration, not a stock counter. Inactive is a safe existing alternative to deletion, but a separate archive flag/history and catalogue-model-to-unit relationship are missing. There is no deletion API. Status changes are rejected while open bookings exist. Existing bookings must stay linked to their original vehicle IDs.

Multi-image API exists at PUT `/api/admin/vehicles/:id/images`; files are `vehicleGallery.service.js`, `vehicleGallery.repository.js`, `vehicleGallery.validation.js`. The editor only uploads/edits one primary image; a reorder/remove/primary gallery editor is still required. Upload storage already exists under `backend/uploads`, using `modules/uploads/upload.*`; JPEG/PNG/WebP signatures are checked and the size limit is 4 MB. Reuse this service.

### Rules, prices and deposits

`frontend/src/admin/pages/Settings.jsx` and `admin/features/settings/ShopSettingsForm.jsx` already edit tax, billing block, late grace, cancellation/change cutoff and maximum rental days. Backend `modules/settings/settings.{routes,controller,service,repository,validation}.js` persists JSON in the `settings` table. APIs are GET `/api/settings` and admin-only PUT `/api/admin/settings`.

Vehicle rates/deposits are database-backed already. Admin input is rupees and converted to integer paise. Database/API/calculation amounts are paise; UI `utils/formatters.js` converts for display. Tax is basis points. `modules/bookings/pricing.service.js` computes authoritative vehicle prices; `modules/availability/rentalWindow.service.js` validates dates and rounds duration.

Missing: vehicle-specific rule overrides, independently managed discount policies, add-on rates and stock, included helmet rules, configured per-booking limits, and full immutable policy-version snapshots. Existing bookings preserve rate/base/tax/deposit amounts, but some operational rules are read from current settings.

### Existing checkout correction (work preceding the expanded Admin request)

The vehicle-card Book Now route remains `/checkout?vehicle=...`. `pages/Checkout.jsx` now composes the existing BookingForm/BookingSummary with `components/booking/CheckoutVehicles.jsx`, `CheckoutTotals.jsx`, `QuantityControl.jsx` and `hooks/useCheckout.js`. `/booking` is a compatibility redirect to checkout. The separate listing entry to the old planner was removed.

Backend `modules/bookings/checkout.{routes,service,repository,validation}.js` supplies GET `/api/checkout/catalog`, POST `/api/checkout/quote`, POST `/api/checkout/reserve`. `0006_checkout_orders/migration.sql` adds checkout_orders, checkout_items and booking_addons without altering old tables. One existing operational Booking is created per physical vehicle, inside one write transaction. Confirmation displays all references and the combined total; payment/pickup/return remain per physical vehicle. Replays use a submission key, request fingerprint and secret token; prices and availability are checked again before save.

This is NOT the requested complete dynamic add-on system. Current helmet rate/billing/stock are optional environment configuration; none were set for the real preview and helmet selection remains disabled there. Test rates were set only inside isolated test processes. This transitional mechanism must be replaced by database/Admin configuration, not presented as the finished solution.

Identical vehicles are currently grouped only when brand, name, category, engine, fuel, transmission, seats, rate and deposit match exactly. Different names/variants are never guessed to be the same model. Stable admin-managed model IDs are needed so editing a name/rate cannot change model identity. Existing inventory has predominantly one physical unit per model; no fake vehicles were added to increase quantities.

### Inventory and booking operations

Reuse `modules/availability/availability.{rules,service,repository,validation}.js`, `rentalWindow.service.js`, `modules/bookings/booking.service.js`, `booking.read.service.js`, `booking.presenter.js`, `bookingGraph.repository.js`, `modules/rentals/rental.service.js` and `modules/payments/payment.service.js`.

Existing vehicle availability considers overlapping reservations, maintenance, active/overdue rentals and physical status. `config/database.js` serializes writes and acquires a SQLite write lock before reading availability. New checkout allocation uses the same transaction and core createBooking service.

Missing: a reusable add-on reservation/issue/return ledger, damaged/unserviceable add-on stock, included/free quantities, stock reduction validation against future reservations, and an inventory report for reserved versus issued equipment. Current helmet reservation follows the owning Booking state; it is not independent equipment issue/return tracking. No configured booking-expiry workflow exists; do not silently expire confirmed pay-at-shop bookings.

### Customer and Admin presentation

Reuse customer `pages/BookingConfirmation.jsx`, `components/booking/PriceBreakdown.jsx`, `pages/MyBookings.jsx`, `services/bookingTokens.js`, and `services/apiClient.js`. Profile redirects to My Bookings; an authenticated customer account/dashboard is not implemented and must not be claimed complete.

Reuse Admin `pages/FleetAvailability.jsx`, `pages/CreateBooking.jsx`, `pages/BookingManagement.jsx`, `features/bookings/{BookingManager,BookingHeader,BookingCharges,BookingActions}.jsx`, `features/payments/{PaymentForm,BookingLedger}.jsx`, `features/rentals/{RentalInspectionForm,RentalCompletionForm}.jsx`, existing Filters/SearchField/Modal/StatusBadge and `hooks/useAdminAction.js`.

Admin manual booking still selects one physical vehicle; it needs the same reusable multi-item quote/reservation service when that phase is approved. Ledger totals already use booking.rentalTotal/outstanding; add-ons need an explicit readable line-item display, not only an aggregate number.

## 3. Current end-to-end flow

SQLite vehicles/settings/bookings -> Prisma adapter + repositories -> vehicle availability/presenter and pricing/booking services -> Express routes -> frontend services/apiClient.js (session cookie + CSRF) -> useVehicles/useQuote for legacy paths or useCheckout for the corrected checkout -> controlled quantities + server quote -> atomic checkout reservation -> historical Booking rows + optional add-on snapshot -> confirmation/admin/payment ledger.

`frontend/src/services/vehicleService.js`, `bookingService.js`, `hooks/useVehicles.js`, `hooks/useQuote.js`, `hooks/useBookings.js` remain reusable. React Query handles server state; avoid a second global state/pricing system.

## 4. Proposed data model (logical schema, not applied)

Keep existing Booking, Vehicle, Customer, Payment, Refund, Rental, MaintenanceBlock, AuditLog and ShopSettings identities and history.

1. **VehicleModel**: stable ID, category, display name, specifications, images, enabled/archived state, version. Explicitly map each existing physical Vehicle to a reviewed model. Never merge stock by fuzzy names. Physical registration/maintenance/odometer stay on Vehicle.
2. **AddOn**: stable ID, unique code (helmet is an ordinary add-on code), name, description, image, pricePaise, billingType (`per_booking` or `per_hour`), totalStock, unserviceableStock, maxQuantityPerOrder, enabled, archivedAt, version. Quantity always multiplies unit price; `per_item` is not a second ambiguous billing axis. If a separate billing meaning is required, define it before implementing it.
3. **AddOnCategoryRule**: addOnId + category, eligibility and includedQuantityPerPhysicalVehicle. Free/included units reserve real stock too. Unconfigured included quantities must not be advertised as a benefit.
4. **AddOnAllocation**: addOnId, checkoutId, scheduled start/end, quantity, includedQuantity, paidQuantity, status (reserved/issued/returned/cancelled/expired), actual issued/returned timestamps and staff. Support partial issue/return through allocation events. Equipment stays unavailable while issued even after the scheduled return time.
5. **BookingAddOnLine**: immutable allocation/booking link plus name, price, quantity, billing, duration, included/paid units, base, tax and deposit snapshots. Evolve the current one-row helmet snapshot additively into multiple generic lines; preserve existing snapshot amounts exactly. Assign each financial charge to one existing Booking ledger deterministically; never count the order aggregate as additional revenue.
6. **PricingPolicyVersion / VehicleRentalRule**: versioned, validated overrides for shop/model/vehicle rates and operational rules. Keep current vehicle rates/deposits authoritative until an admin explicitly activates a replacement policy. Snapshot resolved rules into new bookings. Existing amounts remain unchanged.
7. **DiscountRule**: optional, disabled until configured; fixed paise or basis points, active dates, eligible scope and limits. No invented production promotion. Allocate rounding remainders deterministically so line amounts add up exactly.
8. **InventoryEvent**: add-on quantity adjustments, issue/return, maintenance/damage, reason, staff and timestamp. Stock changes cannot erase existing reservations.

Constraints/indexes: unique model/add-on codes and registration; allocation indexes on addOnId/status/start/end; stable checkout idempotency key; unique child booking membership; nonnegative integer money/stock; foreign keys in relational storage; explicit reference checks and unique indexes if MongoDB is selected. Archive masters instead of deleting referenced records.

## 5. Dynamic pricing and stock workflow

Admin saves validated configuration -> database stores new version and audit event -> customer fetches safe public options -> one backend pricing function resolves current vehicle rules, included units, add-ons, discount, tax and deposits -> UI displays returned itemised quote.

Reserve re-reads all inputs and configuration inside the allocation transaction. Client totals are only a stale-quote check, never the source of price. If stock or price changed, fail with a clear re-quote response instead of silently charging a changed amount. Save price/policy snapshots and all reservations atomically, then return confirmation. Confirmed bookings never recompute from newly edited prices.

Available add-on stock is serviceable stock minus peak overlapping commitments, with issued equipment blocking until actual return. Count included and paid units. A reservation window must test the maximum simultaneous overlap, not blindly sum every reservation that intersects any part of the requested window. Admin stock reductions must satisfy the same peak future commitment check. Cancellation releases only eligible allocations; expiration applies only to a separately configured pending/hold workflow. Existing confirmed reservations do not auto-expire.

For SQLite, reuse the existing write-lock transaction and expand it to the add-on allocation check. For MongoDB, use a transaction-capable replica set/Atlas deployment, deterministic writes to inventory-version/lock documents for each affected resource, conditional version checks and bounded whole-transaction retries. A transaction doing reads then unrelated inserts alone is insufficient to prevent concurrent range-overlap write skew. Never rely on a Node process mutex across multiple API instances.

## 6. Exact file modification plan after approval

**Reuse/extend existing frontend:**

- `frontend/src/admin/routes.jsx`, `frontend/src/config/adminNavigation.js` (new protected sections).
- `frontend/src/admin/pages/VehicleManagement.jsx` and `admin/features/vehicles/VehicleEditor.jsx` plus their CSS (reviewed model mapping, archive and image editor).
- `frontend/src/admin/pages/Settings.jsx`, `admin/features/settings/ShopSettingsForm.jsx` plus their CSS (pricing/rule controls).
- `frontend/src/admin/pages/FleetAvailability.jsx` (reuse for physical fleet; add equipment inventory reporting alongside it).
- `frontend/src/pages/Checkout.jsx`, `hooks/useCheckout.js`, `components/booking/CheckoutVehicles.jsx`, `CheckoutTotals.jsx` plus CSS (dynamic options and generic add-on lines).
- `frontend/src/admin/pages/CreateBooking.jsx` and `admin/features/bookings/BookingManager.jsx`, `BookingCharges.jsx` (shared multi-item workflow and itemised charges).
- `frontend/src/pages/BookingConfirmation.jsx`, `components/booking/PriceBreakdown.jsx` and relevant customer lookup response handling (complete immutable breakdown).

**Genuinely new frontend:**

- `frontend/src/admin/pages/AddOnManagement.jsx` + CSS, a filtered/reused HelmetManagement page + CSS, `Inventory.jsx` + CSS, and `RentalPricing.jsx` + CSS only for workflows that do not fit existing Settings/Fleet views.
- `frontend/src/admin/features/addons/AddOnEditor.jsx` + CSS, `InventoryAdjustmentForm.jsx` + CSS; helmet uses the same editor/service, not a duplicate pricing system.
- `frontend/src/components/booking/CheckoutAddOns.jsx` + CSS and `frontend/src/services/addOnService.js`.
- Vehicle gallery management component inside `admin/features/vehicles` using the existing upload/gallery endpoints.

**Reuse/extend existing backend:**

- `backend/prisma/schema.prisma` and reviewed additive migrations if retaining SQLite.
- `backend/src/modules/vehicles/vehicle.{routes,controller,service,repository,validation}.js`, and existing `vehicleGallery.*`.
- `backend/src/modules/bookings/checkout.{routes,service,repository,validation}.js`, `booking.service.js`, `booking.read.service.js`, `booking.presenter.js`, `bookingGraph.repository.js`, and `pricing.service.js` (move pure shared pricing once, update all imports).
- `backend/src/modules/settings/settings.{service,validation}.js`, `modules/rentals/rental.service.js`, `modules/payments/payment.service.js` and `modules/analytics/analytics.service.js` where needed for snapshot/itemised accounting.
- `backend/src/app.js` for routers; reuse authenticate/authorize/validateRequest/audit.
- `backend/scripts/baseline.mjs` must be reviewed before deploying to databases with optional tables; its current fixed 13-table/full-snapshot assumptions are unsuitable for the preview schema.

**Genuinely new backend:**

- `modules/addons/addOn.{routes,controller,service,repository,validation}.js`.
- `modules/inventory/inventory.{routes,controller,service,repository,validation}.js`.
- `modules/pricing/pricing.service.js` plus focused discount/policy validation/repository files. Do not introduce controllers/repositories for pure arithmetic.
- A stable fleet/model module only where existing vehicle services cannot keep model/unit responsibilities clear.
- Isolated integration tests for admin writes, dynamic prices, historic snapshots, included stock, issued/returned stock, simultaneous requests, stock reductions, cancellation, authorization and accounting.

Proposed new APIs: admin CRUD/archive `/api/admin/addons`, helmet preset through the same add-on API; GET/POST `/api/admin/inventory` and adjustment/issue/return actions; versioned pricing/rule endpoints. Public options should use the existing checkout catalogue and quote response, not expose supplier details or staff records. Existing single-vehicle APIs stay backward compatible.

## 7. Migration risks and database decision

There is no safe one-line SQLite-to-MongoDB switch. Current repositories use SQL queries, relational foreign keys, joins, SQLite locks and Prisma models. Changing a connection string would break bookings. Existing UUIDs, booking references, token hashes, financial snapshots, payment/refund links, customer contact snapshots and audit history must survive any migration.

**Recommended path:** retain the working SQLite/Prisma database for this single-shop incremental upgrade, introduce generic add-ons through additive migrations, and keep database migration a separately approved project. This meets dynamic Admin management without rebuilding the storage layer.

**If MongoDB is mandatory:** approve a separate database migration stage before dynamic Admin work. Set up a transaction-capable deployment, select a connector compatible with the project's pinned versions, migrate copies with stable string IDs and exact paise, rebuild repositories/indexes/transaction conflict guards, run parity tests and reconcile counts/totals, rehearse rollback, then schedule a controlled cutover with writes paused. Do not dual-write production databases casually. Existing SQLite remains the rollback source.

Official MongoDB documentation confirms standalone deployments do not support multi-document transactions: https://www.mongodb.com/docs/manual/core/transactions-production-consideration/

The installed Prisma version must be treated separately from changing online documentation; no ORM upgrade or Mongo connector change was performed in this review.

Other risks: stock reduction beneath future commitments; included helmets consuming untracked stock; partial cancellation of shared equipment; rates edited while checkout is open; default values accidentally overwriting existing settings; archive operations breaking historical images; discounts/tax counted twice; and customer auth being mistaken for staff auth. Address each with explicit migrations, snapshots and tests.

## 8. Approval sequence and phase gates

**Phase 1 — this review:** exact current architecture, file map, schema proposal, risks, database decision and plan. Complete.

**Phase 2 — persistence and generic catalogue:** after approval, add AddOn/category/rule/allocation models and APIs; no production prices prefilled; migrate copies first; authorization/input/audit tests. Replace the transitional helmet environment settings with database configuration. Confirm database choice first.

**Phase 3 — Admin controls:** reusable add-on editor + Helmet view, stock/quantity limits, included category rules, archive/activation, model/unit mapping, gallery editor and versioned pricing controls. Changes must persist and reload correctly.

**Phase 4 — central pricing and concurrency:** shared website/manual pricing, exact paise, configured discounts/taxes/deposits, immutable snapshots, peak-overlap/issued equipment checks, concurrency/replay/rollback tests. Historical booking data must remain unchanged.

**Phase 5 — customer/admin workflow integration:** existing checkout remains the single Book Now destination; dynamic add-ons, complete summary and receipt, Admin phone/walk-in group bookings, equipment issue/return, itemised ledgers and My Bookings display. A new authenticated customer dashboard is a distinct feature if still required; do not quietly call My Bookings a dashboard.

**Phase 6 — rollout verification:** frontend lint/build, backend and browser tests, Admin role tests, real DB-copy migration rehearsal, light/dark 1440/1024/768/390/320 checks, no overflow, accounting/stock reconciliation, backup and rollback instructions. No production DB reset or automatic seed.

Approval requested because the new instruction explicitly says “After approval, implement each phase carefully.” Required decision: keep SQLite for this upgrade, or include a separately tested MongoDB migration. No real helmet rate/stock has been supplied; these should be entered through the approved Admin controls, not invented in code.

## 9. Verification already executed for the preceding checkout correction

- `npm run db:generate`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm test`: 34/34 passed, including 5 new checkout integration tests.
- `node backend/.artifacts/checkout/verify.mjs`: passed in an isolated seeded database. Tests actual vehicle-card Book Now -> checkout, two identical-model physical units + a car, two helmets using test-only rates, authoritative total, real save, confirmation links and old `/booking` alias. Light/dark responsive checks passed at 1440, 1024, 768, 390 and 320; no horizontal overflow or runtime page errors observed.
- Integration checks cover stock conflict/concurrency, no partial order on allocation failure, safe retry, stale/tampered total, CSRF, booking access, helmet billing snapshots, cancellation release and staff payment total.
- Screenshots: `backend/.artifacts/checkout/<width>-<theme>.png`. These use fixture stock/prices only and do not describe real shop stock.
- Dynamic Admin, MongoDB migration, independent equipment ledger and customer dashboard tests have NOT been run because those requested features are not implemented.

## 10. Current change manifest for the preceding checkout request

Created: backend migration 0006; checkout repository/routes/service/validation; checkout integration tests; frontend useCheckout hook; CheckoutVehicles JSX/CSS and CheckoutTotals JSX.

Modified: backend schema, app router, booking service/read service/presenter; frontend Checkout, Booking compatibility route, BookingForm, BookingSummary, PriceBreakdown, BookingConfirmation JSX/CSS; removed the separate planner entry/CSS from Vehicles; backend .env.example documents optional transitional configuration.

No vehicle images, Header, Footer, unrelated homepage sections, production/agency records or actual contact details were changed. Legacy Phase-2 planner helper files were preserved; they are not used by the new checkout and can be retired after a reference audit in an approved cleanup phase. No blind deletion was performed.
