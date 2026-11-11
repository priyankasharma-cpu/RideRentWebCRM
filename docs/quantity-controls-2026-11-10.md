# Vehicle and helmet quantity fixes — 10 November 2026

## Confirmed causes

- The running shop database is `backend/data/riderent.sqlite`: 20 physical vehicle records and 12 bookings were observed read-only. Honda Dio, TVS Apache RTR and Yamaha MT15 each have one matching physical record. Their selected-period catalog availability was one. A disabled plus at one is correct; no additional inventory was created.
- No `addons` record with code `helmet` exists in that database. The public catalog correctly disables helmet rentals. Prices, billing, stock, maximum quantity and eligible categories must be configured by the operator, not inferred from this screenshot.
- Checkout previously edited the availability-derived cart and removed every zero-quantity row. During availability refresh this could inadvertently discard unrelated selections. Updates now operate on current raw React state and change/remove only the targeted row.
- A quote refresh previously removed the useful breakdown. The summary now immediately shows current quantities while monetary values remain unavailable until the matching server quote succeeds. Confirmation remains disabled while unverified, pending or failed.
- Physical units are real `vehicles` records; there is no persistent VehicleModel foreign key. Existing checkout groups identical specifications and prices. This supports multiple existing identical units, but editing a unit's name/rate/specifications can split that grouping. This requires a separately approved model migration.

## Files changed in this batch

- `frontend/src/utils/checkoutSelections.js`: targeted functional cart steps/removal, bounded helmet steps, included/paid helmet limits.
- `frontend/src/hooks/useCheckout.js`: distinguish presentation metadata/quantities from verified inventory, clamp helmets, quote effective selections only.
- `frontend/src/pages/Checkout.jsx`: functional cart updates, effective helmet synchronization, authoritative reservation payload and pending summary inputs.
- `frontend/src/components/booking/QuantityControl.jsx`: separate increment restriction and explanatory tooltip.
- `frontend/src/components/booking/CheckoutVehicles.jsx`: targeted quantity actions, safe zero removal, stock-limit explanation, helmet setup/support path.
- `frontend/src/components/booking/CheckoutVehicles.css`: scoped limit/status styling and stable summary space.
- `frontend/src/components/booking/CheckoutTotals.jsx`: immediate quantities, pending amounts, retry/error status without showing stale prices.
- `frontend/src/admin/features/bookings/BookingCharges.jsx` and `.css`: display saved add-on quantity, included/paid count and historical charge.
- `frontend/tests/checkoutQuantity.test.js`: cart and helmet boundary regressions.
- `backend/tests/e2e/availability.mjs`: targeted decrement/removal, rapid quantity quote isolation and checkout viewport checks.
- `backend/tests/e2e/admin-addons.mjs`: updated unavailable-helmet copy assertion.
- This report. No files deleted; no dependencies added; no backend business rules or schema changed in this batch.

## Operator setup

Open `/admin/helmets` using an authorized admin account. Configure actual total stock, damaged/unavailable stock, actual rental rate, per-booking/per-hour billing, total maximum per checkout, eligible categories and included quantity per vehicle. Enable rentals and save. Included helmets also consume stock. Extra quantity is limited by both available stock and the remaining maximum after included helmets. The existing add-on APIs validate these values and historical reservations.

For vehicles, add an actual physical vehicle through vehicle management with its own unique registration. Do not create duplicate registrations or dummy records just to enable plus. Under the current compatibility grouping, matching model specifications/rates/deposits are needed to share a checkout quantity. The existing 50-vehicle request safety limit is not a fleet-size limit; unlimited fleet growth and larger group requests need a separately reviewed limit/pagination policy.

## Pricing and reservation safety

Quote requests are keyed by the current rental period, verified vehicle quantities and extra helmets. Debouncing/abort signals and separate query keys isolate old responses. A failed/pending quote does not authorize confirmation. Reserve recalculates prices and availability server-side and checks quote signature/expected total; it never trusts client totals. Prices use integer paise. Included and paid add-ons are saved in allocation snapshots.

SQLite transactions acquire a write lock before availability reads; process-local serialization supplements the database lock. Existing independent-connection, concurrent vehicle/add-on reservation and rollback tests remain authoritative. Overlap uses exclusive end boundaries, cancellation releases inventory, and active/unreturned allocations remain held. No production reservation was submitted for this verification.

## Proposed model migration — NOT APPLIED, approval required

1. Back up the actual SQLite database and rehearse on its copy. Record row counts, vehicle IDs/registrations, booking relationships and price snapshots.
2. Add `VehicleModel` metadata/pricing records and an initially nullable `modelId` relationship on the existing physical `Vehicle` entity/table. Preserve existing physical IDs, registrations and all booking foreign keys. Do not rename the physical table or replace the database.
3. Before adding columns, convert positional vehicle SQL inserts to explicit column lists. Inventory all SQL/Prisma consumers, seeds and tests affected by the new relationship.
4. Produce a read-only proposed mapping for operator review. Similar names alone must never merge different models. Backfill only the explicitly approved mapping; create no physical units.
5. Index the model/status lookup and update checkout grouping to stable model IDs. Keep old URLs and vehicle IDs compatible. Define model prices versus permitted unit overrides explicitly before implementing admin editing.
6. Add dedicated model/physical-unit admin workflows. Enforce the relationship for new units, then safely enforce completeness after all reviewed mappings exist. Any SQLite table rebuild requires a separately reviewed migration and integrity checks.
7. Regenerate Prisma, run foreign-key and row/snapshot comparisons, inventory/concurrency tests and full booking regressions against the copy. Apply to the shop database only after approval and a verified backup/rollback procedure.

## Remaining limitations

- Actual multi-unit booking cannot exceed the shop's current one-unit-per-group inventory. Multi-unit success is tested using distinct physical records in an isolated test database only.
- Helmets remain unavailable in the live shop until the operator supplies real configuration. This work deliberately did not seed stock or prices.
- Persistent model identity and the model/unit administration redesign are deferred pending approval.
- The existing customer reference-lookup/confirmation pages show saved add-on charges. An authenticated customer dashboard/OTP system is not implemented by this batch.
- Automated Edge checks do not establish behavior on physical Android/iOS devices. Real-device testing is still required before launch.

## Verification

Tests use disposable databases and temporary test users. Commands: `npm run lint`, `npm run build`, `npm test`, `node --test frontend/tests/*.test.js`, `node backend/tests/e2e/availability.mjs`, `node backend/tests/e2e/admin-addons.mjs`.

Executed results:

- PASS: frontend lint and production build.
- PASS: all 45 backend integration tests, including simultaneous vehicle/add-on requests, independent SQLite connections, rollback, zero/unavailable-stock rejection, historical prices, cancellation release, CSRF and authorization.
- PASS: all 13 frontend tests, including three new quantity/helmet regression cases.
- PASS: availability browser suite: plus/minus, zero removes only its target, other selections survive an in-flight catalog refresh, quantity limits, zero stock, quote failure/retry, immediate pending amount invalidation, delayed old quote isolation, and actual single/mixed multi-unit reservations in a disposable database.
- PASS: admin add-on browser suite: helmet setup/edit/persistence, included versus paid quantity, maximum boundary and decrement, per-hour/per-booking quote changes, disabled rentals, saved helmet quantities in customer confirmation and admin booking details, staff access restrictions.
- PASS: Edge light/dark listing checks at 1440/1024/768/390/320px; checkout checks at 1440/768/390/320px; admin checks at 1440/1024/768/390/320px. No horizontal overflow or captured runtime errors. Desktop/mobile screenshots were generated; the 390px light checkout screenshot was visually inspected.
- PASS: Prettier checks for every file in this batch.
- An intermediate newly added browser test failed because its delayed route was unregistered before completion. The test now waits for route completion; the complete suite was rerun successfully. This was test harness cleanup, not an inventory bypass.
- NOT TESTED: physical Android/iOS browsers and deployment-specific load testing. No production booking or admin configuration write was performed.

Browser evidence is saved under ignored `backend/.artifacts/availability-fixes/` and `backend/.artifacts/admin-addons/`. The SQLite experimental-runtime warning is reported by Node; it is not a failed assertion. A final read-only database check still showed 20 vehicles, 12 bookings and no helmet master record.
