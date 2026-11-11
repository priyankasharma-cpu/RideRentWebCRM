# RideRent multi-vehicle booking and customer portal — Phase 1

Inspection date: 5 November 2026 (Asia/Calcutta).

This document is the proposed implementation plan only. No application source, database schema, migrations or business records were changed during this assessment. The attached request explicitly says to complete Phase 1 before implementing later phases.

## 1. What exists

The application is React + Vite + JavaScript, Express, Prisma and **SQLite**. MongoDB is not the configured database. Keep the existing relational architecture; this feature does not justify a database-platform replacement.

Frontend source already has pages/, components/booking/, components/vehicles/, admin/, hooks/, services/, config/, context/, styles/ and utils/. Backend modules are auth, vehicles, availability, bookings, customers, rentals, payments, maintenance, analytics, settings, audit, uploads and contact. No add-ons module, customer OTP provider or customer session model exists.

### Current customer flow and exact file map

1. `frontend/src/routes.jsx` registers `/vehicles`, `/vehicles/:slug`, `/checkout`, `/booking/confirmation/:id`, `/my-bookings`, `/my-bookings/:id`, `/login`, `/profile` and admin routes.
2. `pages/Vehicles.jsx`, `hooks/useVehicleListing.js`, `components/vehicles/VehicleCard.jsx` select a single physical vehicle and pass its ID and shop-local dates to Checkout.
3. `pages/VehicleDetails.jsx` and `hooks/useQuote.js` also support single-vehicle quotes and booking links.
4. `pages/Checkout.jsx` owns one `vehicle` URL parameter, dates, submit/error/busy state and booking creation.
5. `components/booking/BookingForm.jsx` collects name, mobile, optional email and policy acceptance. Email is currently optional in both UI and backend validation.
6. `components/booking/PeriodFields.jsx` and `utils/rentalTime.js` handle pickup/return inputs and Asia/Kolkata conversion. `toUTC()` adds the fixed IST offset; backend validates the UTC window.
7. `components/booking/BookingSummary.jsx` and `PriceBreakdown.jsx` display one vehicle, billing hours, paise-based rate, tax and separate deposit.
8. `services/bookingService.js` already provides quote/create/lookup/get; `services/apiClient.js` supplies same-origin cookies, CSRF and scoped booking tokens. Reuse this service instead of adding duplicate bookingApi.js functions.
9. `services/bookingTokens.js` keeps per-booking access tokens in sessionStorage; `hooks/useBookings.js` loads token-scoped booking data.
10. `pages/BookingConfirmation.jsx`, `components/booking/BookingSuccess.jsx` and supporting CSS show confirmation, rescheduling, cancellation and payment/deposit details. The current BookingSuccess is not the requested comprehensive multi-item modal.
11. `pages/MyBookings.jsx` posts reference and phone to `/api/bookings/lookup`. `pages/Login.jsx` and `pages/Profile.jsx` redirect to My Bookings. There is no verified customer account/dashboard.
12. `context/AuthContext.jsx` and `services/authService.js` are staff authentication, not a customer account system. `hooks/useApp.js` exposes that context to existing consumers.

### Backend map

- `src/server.js`, `src/app.js`: database/server initialization; routers, cookies, CSRF, rate limits, staff guards and error handling.
- `src/config/env.js`, `databasePath.js`, `paths.js`, `database.js`: environment loading, SQLite file selection, Prisma adapter, SQL helpers and transaction serialization.
- `prisma/schema.prisma`: Vehicle, Booking, BookingContact, Customer, Rental, Payment, Refund, Session, User, MaintenanceBlock, RentalInspection, AuditLog, ShopSettings; also later VehicleImage and ContactInquiry models.
- `modules/vehicles/vehicle.routes.js`, `.controller.js`, `.service.js`, `.repository.js`, `.presenter.js`, `vehicleState.repository.js`: physical inventory records, public/admin endpoints and computed availability.
- `modules/availability/availability.rules.js`, `.service.js`, `.repository.js`, `.validation.js`, `rentalWindow.service.js`: overlap, maintenance, active/inspection rental rules, future dates, max duration and billing increments.
- `modules/bookings/booking.routes.js`, `.controller.js`, `.service.js`, `.repository.js`, `.validation.js`: quote/create/lookup/cancel/reschedule and shared website/manual booking service.
- `modules/bookings/pricing.service.js`, `booking.read.service.js`, `bookingGraph.repository.js`, `booking.presenter.js`, `bookingAccess.service.js`: rates, snapshots/read models, ledger totals and access checks.
- `utils/money.js`, `dateTime.js`, `phone.js`, `crypto.js`: integer paise, tax rounding, time, phone normalization and cryptography.
- `modules/auth/session.service.js`, `session.repository.js`, `auth.service.js`, `auth.controller.js`, `auth.routes.js`: hashed session tokens and HttpOnly staff cookies.
- `middleware/authenticate.js`, `authorize.js`, `csrf.js`, `rateLimiter.js`, `validateRequest.js`: trust boundaries to preserve and extend carefully.
- `modules/payments/payment.service.js`, `.repository.js`, `.validation.js`, `.routes.js`: offline receipts, partial balances and refunds.
- `modules/rentals/rental.service.js`, `.repository.js`, `.validation.js`, `.routes.js`: licence readiness, actual pickup/return, inspections, late fees and completion.
- `modules/customers/customer.service.js`, `.repository.js`, `.routes.js`: staff-side customer records and driving-licence verification.
- `modules/settings/settings.service.js`, `settings.validation.js`: current pricing/time policies. No helmet pricing or quantities are configured.
- `modules/analytics/analytics.service.js`, `analytics.repository.js`, `modules/audit/*`: revenue/fleet reports and audit trail requiring group-aware review.

### Existing admin integration points

`frontend/src/admin/pages/CreateBooking.jsx`, `BookingManagement.jsx`, `ActiveRentals.jsx`, `Returns.jsx`, `Payments.jsx`, `Customers.jsx`, `Settings.jsx`, `Analytics.jsx`; `admin/features/bookings/BookingManager.jsx`, `useBookingManager.js`, `BookingHeader.jsx`, `BookingCharges.jsx`, `BookingActions.jsx`, `RescheduleForm.jsx`; `admin/features/payments/PaymentForm.jsx`, `BookingLedger.jsx`; `admin/features/rentals/RentalInspectionForm.jsx`, `RentalCompletionForm.jsx`; `admin/routes.jsx`, `config/adminNavigation.js`.

## 2. Current data flow

Vehicle row → vehicle repository/service/presenter → `/api/vehicles` → vehicleService/useVehicles → selection/detail → Checkout → `/api/quote` → pricing + availability → `/api/bookings` → createBooking transaction → booking/contact/audit rows → BookingConfirmation/read model.

Phone and walk-in admin requests already use the same `createBooking()` core service. This is useful and should remain true for grouped reservations.

### Important constraints and gaps

- Each Vehicle has a unique registration and represents one physical asset. There is no separate VehicleModel identity. Quantity 2 cannot mean reserving one Vehicle ID twice.
- Booking has mandatory `vehicleId`, single scheduled window, hourly rate/base/tax/deposit and a unique reference. Rental is one-to-one with Booking. Payments belong to that single Booking.
- Existing quantity support must therefore be built on explicit physical allocations, not a frontend count alone.
- Same-model inventory must be explicitly grouped by a stable model ID, not guessed from fuzzy display names. Two units are offered only if two actual available vehicle records exist.
- `Customer.phone` is unique; email is optional and not unique. Driving-licence `verified` is not proof of phone/email ownership.
- BookingContact preserves booking-time details. Public booking with an existing phone does not overwrite an existing customer profile; preserve that protection.
- Money is integer paise, displayed as rupees. Taxes use integer basis points. `rentalWindow()` rounds the shared duration by configured 15/30/60-minute blocks. Preserve those rules.
- Current rate/deposit/base/tax fields preserve booking pricing; rescheduling changes totals using historical rate. New immutable snapshots should retain original and amended quote versions rather than overwrite the original snapshot.
- Offline receipts support rental/deposit purposes, Cash/UPI/Card recording, partial payments and refunds. The application does not charge a card or perform an online UPI transfer.
- Booking status is confirmed/active/inspecting/completed/cancelled. Payment status is computed from receipts and dues, not a dedicated stored field.
- Availability accounts for overlapping confirmed bookings, maintenance and active/inspection rentals. `transaction()` obtains a SQLite write lock before dependent reads; preserve that protection for all items in one transaction.

## 3. Security boundaries before adding customer login

Current lookup checks reference + normalized phone and issues a per-booking token. This is not OTP authentication and must not become account-wide access.

`bookingAccess.service.js` currently trusts any `request.user`; `requireStaff()` checks that `req.user` exists. They are safe only while `req.user` is exclusively a staff principal. Do not populate this field with customer identities. Add distinct `req.customerAccount`, customer-session middleware/cookie and explicit staff-role guards. Test that customer cookies never open `/api/admin/*` or another customer's booking.

Create expiring OTP challenges bound to channel + normalized destination + purpose. Store a keyed hash, not plaintext OTP; keep the server secret in backend environment. Verify with attempt limits and atomic single-use consumption. Apply destination/IP request limits, resend cooldowns, expiry, rotation on verification and generic request responses that do not reveal account registration. Do not log OTPs in production or place them in ordinary API responses.

A development-only provider can expose generated codes in a local development console with a visible mock-mode notice. It must be explicitly enabled, unavailable in production, and separate from real provider credentials. Production login must fail closed when no real SMS/email provider is configured.

Use opaque, revocable, server-side customer sessions with HttpOnly/Secure production cookies, SameSite and CSRF protection. Customer and staff sessions/logout/cache keys must remain separate.

Do not link all bookings by an unverified typed email or expose a legacy customer's full profile after finding a phone row. Introduce independently verified customer identities. Linking email and phone to one account requires verifying both or an explicit reviewed process. Legacy booking claims should use booking-time contact snapshots plus verified contact and the reference when identity is ambiguous; conflicting/insufficient evidence goes to staff. Never merge customers automatically by email/name similarity.

A guest's newly created booking can still show its immediate confirmation through the narrowly scoped receipt capability. The Show My Booking Status action leads to verified customer access; it does not treat entered contact fields as an authenticated account.

## 4. Proposed backward-compatible data model

Recommended approach: add a customer-facing aggregate while retaining current single-vehicle Booking rows as operational allocations. This avoids forcing every existing rental/payment endpoint through a destructive booking-table rewrite.

- **VehicleModel:** stable model/category identity. Add optional Vehicle.modelId. Existing physical IDs, registration, rates and status stay authoritative. Explicitly review and map legacy inventory; do not create extra vehicles automatically.
- **BookingGroup:** one customer-visible reference, shared schedule, contact snapshot, optional verified account link, submission idempotency key and snapshot version. This is the new multi-vehicle reservation header.
- **BookingItem:** one row per allocated physical vehicle, linking a group, model and exactly one existing operational Booking. Unique operational booking link; one physical unit per item. Display quantities by grouping items, not by duplicating a vehicle ID. Existing standalone bookings remain unchanged and can be presented as one-item reservations.
- **AddOn:** configurable code/name, enabled flag, eligible categories, billing unit, price, included quantity, selection limit and inventory limit where physical availability matters. Helmet charges remain disabled/unconfigured until business values are supplied.
- **BookingAddOn:** quantity/unit-price/tax/category/name snapshots, attached to an eligible allocation and summarized at group level. Maintain any add-on reservation/return inventory when a stock limit is configured. Extra helmet rental must not be described as waiving mandatory rider safety requirements.
- **BookingPriceSnapshot:** append-only booking-time item/add-on/rate/tax/rounding/deposit totals and schedule; append an amendment snapshot on an approved reschedule. Server always recomputes before reserving.
- **CustomerAccount + CustomerIdentity:** independent portal account, verified normalized email/phone identities with unique channel/value and verification timestamps. Link operational Customer records explicitly; existing licence verification retains its meaning.
- **OtpChallenge:** opaque ID, destination binding, keyed code hash, expiry, attempts, consumed state and resend controls.
- **CustomerSession:** hashed opaque token, account ID, CSRF binding, expiry and revocation metadata.
- **PaymentReceiptBatch + allocation links, if needed for group collection:** one group collection command writes existing per-booking Payment records atomically. Add-on dues are included in allocation read totals. Batch metadata is not a second revenue ledger. Keep rental and deposit purposes separate; never count a group receipt and child receipts twice.

A group is not automatically completed because one vehicle was returned. Derive group status from allocations, including partially active/returned/cancelled states, while preserving each existing Booking status. Expose distinct `bookingStatus`, `rentalPaymentStatus` (pending/partial/paid/refunded as applicable), deposit collected/refunded and outstanding balances. Never let customers update payment status.

### Allocation transaction

Validate shared dates → fetch eligible physical units for each requested model → check availability using existing rules → choose distinct available vehicle IDs deterministically → validate add-ons/stock → calculate integer paise/tax/deposit → create group + all operational Booking/BookingContact rows + BookingItems + add-on snapshots + immutable quote + audits inside ONE existing SQLite write transaction → commit → return confirmed receipt.

If any item fails, roll back the whole group. Handle booking submission idempotency and concurrent attempts. Do not promise availability from the earlier quote alone. Keep independent-connection concurrency tests; a JavaScript in-process queue alone is insufficient. SQLite already supports transactions, so no unsafe transaction-free fallback is needed for this project. Reassess database locking if deployment later changes to multiple nodes/a different engine.

## 5. Proposed routes and API contracts

These are new proposals, not existing endpoints.

- `GET /api/vehicle-models/availability?startsAt=...&endsAt=...`: category/model availability counts for real physical units.
- `GET /api/addons`: public enabled catalog; no invented default charge.
- `POST /api/booking-groups/quote`: model quantities, common schedule, add-ons → itemized server quote. A quote does not reserve inventory.
- `POST /api/booking-groups`: required name/mobile/email, cart, dates, policy acceptance and idempotency key → atomic confirmed group receipt. Guest contact entry is not login.
- `POST /api/customer-auth/otp/request`, `/verify`, `/logout`; `GET /api/customer-auth/session`: dedicated customer sessions and provider status.
- `GET /api/customer/profile`, `/api/customer/bookings`, `/api/customer/bookings/:id`: verified ownership, pagination/status filters and scoped details.
- `GET /api/admin/booking-groups`, `GET /api/admin/booking-groups/:id`: group summary with expandable allocation details.
- `POST /api/admin/booking-groups`: phone/walk-in using the same allocation/pricing service.
- `POST /api/admin/booking-groups/:id/payments`: authorized atomic offline collection with explicit allocation/purpose and idempotency; returns derived payment state.
- `POST /api/admin/booking-groups/:id/cancel` and `/reschedule`: atomic group validation/amendment; define partial cancellation before offering it.
- Existing `/api/admin/bookings/:id/pickup`, `/return`, `/complete`, payment/refund and single-booking endpoints remain compatible for each physical allocation.

Retire unauthenticated `/api/bookings/lookup` as an authentication path at the OTP rollout. Any legacy claim route must require verified ownership. Existing per-booking capabilities can be narrowly retained for backward-compatible immediate confirmations without exposing account history.

## 6. Frontend organization

Reuse current paths rather than creating duplicate services or an apps/packages workspace.

New proposed pages:

- `frontend/src/pages/Booking.jsx`: cart/schedule/details/review composition.
- `frontend/src/pages/CustomerLogin.jsx`: channel selection and OTP verification.
- `frontend/src/pages/CustomerDashboard.jsx`: verified profile and categorized bookings.

New focused components, each with its own CSS:

- booking/VehicleSelector, RentalSchedule, CustomerDetails, AddOnsSelector, BookingPriceSummary, BookingReview, BookingSuccessModal.
- customer/OTPVerification, BookingStatusCard, BookingDetails.

Reuse PeriodFields inside RentalSchedule, existing button/theme tokens, image fallbacks, loading/error components and currency/time formatters. BookingPriceSummary can reuse an extended PriceBreakdown rather than duplicating money logic. Reuse native-dialog interaction patterns for the confirmation popup, rendering only saved backend data.

Add `config/bookingConfig.js` for UI labels/limits only; rates/taxes/included helmets/inventory remain backend authoritative. Extend `services/bookingService.js` with grouped methods; add `customerAuthApi.js`, `CustomerAuthContext.jsx`, `useCustomerAuth.js` and focused cart/quote hooks. No browser-side authoritative pricing.

Keep `/checkout?vehicle=...` as a compatibility entry that initializes a one-item cart. Add `/booking` for multi-item booking. Replace `/my-bookings` with verified customer access/dashboard and preserve legacy detail links through an explicit compatibility route. `/login` and `/profile` become deliberate customer aliases. Avoid duplicating or repurposing staff AuthContext.

## 7. Migration and deployment plan

Read-only inspection found:

- `backend/data/riderent.sqlite`: 13 application tables, 20 vehicle records, 12 bookings, no `_prisma_migrations` table; optional gallery/contact tables absent.
- `backend/.artifacts/preview/riderent.sqlite`: 14 application tables, 21 vehicles, 13 bookings, contact table present, gallery table absent, no migration-history table.
- Migration files 0001–0005 exist. File existence does not mean a database has applied them.
- `backend/scripts/baseline.mjs` assumes exactly 13 tables and compares the entire table set. It cannot safely be run unchanged against newer/partially upgraded schemas. Documentation also predates later gallery/contact changes.

Before new migrations, inventory the actual target database, validate existing schema/indexes and establish accurate Prisma history per environment. Do not mark a migration applied unless its real schema matches. Repair baseline verification to compare existing business rows without rejecting newly added tables, while preserving FK checks. Test this on copies of both observed database variants.

Then use separate additive migrations for model/group allocations, add-ons/snapshots, customer identity/OTP/sessions and optional payment-batch references. No reset, db push, seed or silent historical booking conversion. Avoid positional `INSERT INTO ... VALUES(...)` breakage when adding columns: update repositories to explicit column lists before adding columns to existing tables.

Take SQLite-aware backups, test migrations against copies, compare pre-existing row hashes/counts and balances, check FK violations and old endpoint responses. Regenerate Prisma client and deploy backend before enabling new frontend routes. Feature flags keep old readers compatible during rollout; activate customer access only after provider/readiness checks. Restore a backup only during an appropriate maintenance window before new production writes; otherwise use a forward repair so new customer records are not discarded.

## 8. Phased delivery and acceptance gates

**Phase 1 — this assessment:** real file/dependency map, schema/security gaps, migration and phased plan. No runtime changes.

**Phase 2 — cart and reusable UI:** model/category selectors, real quantity limits, shared IST schedule, cart remove/edit, configurable add-on presentation; required email for the new customer flow. Do not display a successful reservation against unimplemented APIs.

**Phase 3 — database and booking engine:** validated grouped quotes/creation, explicit physical allocation, immutable snapshots, configured add-ons, atomic stock/vehicle checks and idempotent create. Test single/multiple models, same-model real units, insufficient stock and independent-connection races before proceeding.

**Phase 4 — review and confirmation:** complete editable customer/cart/add-on/price review, acceptance of Rental Policy and real saved success modal. Show Confirmed only from actual backend status; payment Pending and Pay at Pickup; Show My Booking Status leads to verified access.

**Phase 5 — customer authentication and dashboard:** isolated customer sessions, OTP provider interface/mock mode, generic request responses, attempt/expiry/replay tests, ownership checks, account/profile and paginated status dashboard. No unverified-email merges or phone-only login.

**Phase 6 — admin integration:** group overview/allocations, per-vehicle pickup/return, group payment allocation, partial collection, separate deposit refund, cancellations and reporting without duplicate booking/revenue counts. Preserve staff permissions and old operational records.

**Phase 7 — complete verification:** build/lint, existing backend/browser tests on disposable databases, migration-copy rehearsals, responsive/theme checks and customer/admin end-to-end journey. Verify failure paths, stale quotes, concurrent requests and authorization, not only happy paths.

## 9. Testing plan and current evidence

Inspection found 29 backend integration tests: 22 rental/authorization/pricing/availability/ledger tests, 3 gallery tests and 4 contact tests. Browser runners live in backend/tests/e2e/run.mjs, workflow.mjs and layout.mjs. They create disposable databases rather than target agency data. Existing workflow has a known stale navbar selector from an earlier header change; update the test selector deliberately when preparing the new baseline, not the product header.

These tests were **inspected, not executed during Phase 1**. No new feature is claimed implemented or passing.

Required new coverage:

- Legacy one-vehicle request/response and guest confirmation compatibility.
- Multiple physical units of one model; mixed bike/scooter/car cart; remove/quantity limits; no duplicate vehicle IDs.
- IST conversion, billing increments, invalid/past/too-long windows and quote/create consistency.
- Configured helmets, included quantities, category limits, add-on stock and server revalidation.
- Integer paise, tax rounding, deposits separate from revenue, snapshot preservation and amendments.
- Whole-group rollback, duplicate-submit idempotency, stale quotes, independent SQLite connections and maintenance conflicts.
- Required new-flow email/name/mobile with legacy optional-email records still readable.
- OTP expiry, resend, attempt exhaustion, replay, no enumeration, provider failure and production-mock disablement.
- Customer A cannot read Customer B; verified identity is not a staff principal; logout/revocation; guest token cannot list account history.
- Offline full/partial payments, idempotent receipts, deposit/refund, per-allocation lifecycle and reporting totals.
- Responsive 1440/1024/768/390/320px in both themes; keyboard/dialog behavior; route reload and browser-back cart behavior.

## 10. Production inputs still required

- Real SMS/email OTP provider and backend credentials; sender/template setup where required by that provider.
- Helmet rental prices, billing unit, included quantity, limits, any deposit/tax treatment and actual stock. Until configured, paid helmet add-ons remain disabled.
- Explicit model-to-physical-vehicle mapping and additional real inventory for quantities above one.
- Reviewed pickup address/instructions, payment/cancellation/extension rules and unresolved policy business details; never infer production prices or legal permissions from demo settings.
- Target database/deployment environment and a rehearsed migration-history reconciliation.

No implementation phase after Phase 1 has been started. The proposed next step is Phase 2 UI work, followed by the backend acceptance gate before enabling confirmation.
