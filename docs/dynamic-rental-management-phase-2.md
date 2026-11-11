# Dynamic rental management — Phase 2 implementation

Completed scope: database-backed add-on configuration, protected Admin APIs, generic quote/allocation persistence and compatibility with the existing checkout. Database retained: Prisma + SQLite, following approval to continue with the recommended existing database.

## What is ready

- New `addons`, `addon_categories` and `addon_allocations` tables, with Prisma models and additive migration `0007_dynamic_addons`.
- Reusable catalogue: helmet is the ordinary unique code `helmet`; other add-ons use the same service, validation, stock and price snapshots.
- Configurable rate (integer paise), per-booking/per-hour billing, stock, unserviceable stock, total per-checkout quantity limit, category eligibility, included units, enable/disable and archive.
- Protected Admin list/create/update/archive APIs, audit records and optimistic version checking.
- Checkout reads helmet settings from the database. `HELMET_RATE_PAISE`, `HELMET_BILLING` and `HELMET_STOCK` no longer control new quotes.
- Generic backend add-on selections are supported through `addOns: [{ addOnId, quantity }]`; `helmets` remains a backward-compatible extra-helmet quantity field. Do not specify the same helmet add-on through both fields.
- Included quantities are computed per eligible physical vehicle and automatically reserved; paid quantity is additional. The configured maximum applies to included + paid units combined.
- Backend recalculates charges, taxes and total, validates stock and persists snapshots in the same SQLite write transaction as the vehicles. Client-provided money is never authoritative.
- A quote signature detects changed add-on names, versions, included quantities or other quoted details even if the final total happens to match. Updated checkout submits it; older clients remain compatible without this optional field.
- Booking confirmation/lookup totals include multiple add-on lines. Existing per-vehicle payment ledgers and analytics do not count checkout aggregate totals as new revenue.
- Historical `booking_addons` rows remain untouched, readable and included in helmet stock checks. They are not overwritten or silently repriced.

## Admin API contract

All endpoints below require an authenticated admin role. Staff without admin permission receive 403; guests receive 401. Writes also require the existing session CSRF token.

- GET `/api/admin/addons`: catalogue, categories, versions and conservative inventory summary.
- POST `/api/admin/addons`: create a configured add-on.
- PUT `/api/admin/addons/:id`: full validated update with the current `version`.
- POST `/api/admin/addons/:id/archive`: body `{ "version": <current version> }`. Archive disables new selection and retains historical records. Archived records are read-only in this phase; ordinary enable/disable is reversible before archive.

Example request shape (values intentionally omitted; enter actual shop-approved amounts/stock):

```javascript
{
  code: 'helmet',
  name: 'Extra helmets',
  description: '',
  image: '',
  rate: /* integer paise */,
  billing: /* 'booking' or 'hour' */,
  stock: /* actual total stock */,
  unserviceable: /* damaged/unavailable stock */,
  maxQuantity: /* total allowed per checkout, including free units */,
  enabled: /* true or false */,
  categories: [
    { category: 'Bike', includedQuantity: /* free units per physical bike */ },
    { category: 'Scooter', includedQuantity: /* free units per physical scooter */ }
  ]
}
```

`rate: 0` is valid only when explicitly submitted; no production rate or stock is prefilled by migration. Codes cannot be changed after creation. New versions apply to new quotes; allocated names/rates/billing/quantities/base/tax/version remain snapshots.

Public catalogue is returned by GET `/api/checkout/catalog?startsAt=<UTC>&endsAt=<UTC>` in `addOns` plus a compatibility `helmets` object. The existing POST `/api/checkout/quote` and `/api/checkout/reserve` accept generic add-ons. The customer UI currently exposes helmets; a generic customer add-on selector belongs to the later workflow UI phase.

## Inventory semantics and safety

Availability uses peak simultaneous quantity in the requested period. Two adjacent or non-overlapping reservations are not incorrectly summed as simultaneous stock usage. At equal timestamps, return/end events precede pickup/start events.

Both included and paid units consume stock. Confirmed reservations consume their scheduled windows. Active and inspecting rentals conservatively hold their allocated equipment until the existing rental workflow closes; they are not automatically released merely because their scheduled return time passed. Cancellation releases the owning booking's quantity through its status.

Admin stock reductions are rejected if serviceable stock would fall below peak future commitments. Creating the helmet master also checks legacy helmet commitments. Transactions acquire the existing SQLite write lock before allocation reads; simultaneous reservations cannot independently allocate the same final stock.

In the Admin list, `inventory.reserved` is the peak future confirmed commitment, not the sum of all future bookings. `inventory.issued` is derived from active/inspecting rental states. Independent equipment issue/return events, partial returns, damaged-item events and shared-order cancellation policies are not implemented yet; do not describe these summary fields as physical equipment scans.

Generic paid charges are assigned once to the first eligible child booking ledger. Included units are allocated per eligible physical vehicle. The combined checkout summary adds child charges once. Equipment currently follows each owning child's rental lifecycle; independent order-level equipment management is a later phase.

## Migration and current local state

Only the running preview database was migrated. Its SQLite-consistent backup is:

`backend/.artifacts/preview/riderent-before-dynamic-addons-20261105-140823.sqlite`

Existing business-table row hashes were unchanged and `PRAGMA foreign_key_check` passed. The new add-on catalogue is empty: no made-up helmet prices, stock or sample add-ons were inserted into the live preview.

Agency `backend/data/riderent.sqlite` was inspected read-only and remains 20 vehicles / 12 bookings without this migration. Do not reset, seed or blindly deploy migrations to it. Neither existing database has Prisma migration history; the current baseline script's fixed-table assumptions must be reviewed before a production rollout.

To deploy to an existing environment: identify the exact database file, take a SQLite-aware backup, verify checkout migration 0006 is present, review and apply 0007 inside an explicit transaction during a controlled write pause, compare pre-existing row snapshots and foreign keys, regenerate the pinned Prisma client, and restart/check the API. Rehearse on a database copy first. Do not use `db push --force-reset`, `migrate reset` or setup/seed against an existing shop database.

## Files created

- `backend/prisma/migrations/0007_dynamic_addons/migration.sql`
- `backend/src/modules/addons/addOn.routes.js`
- `backend/src/modules/addons/addOn.controller.js`
- `backend/src/modules/addons/addOn.service.js`
- `backend/src/modules/addons/addOn.repository.js`
- `backend/src/modules/addons/addOn.validation.js`
- `backend/src/modules/addons/addOn.inventory.js`
- `backend/src/modules/addons/addOn.pricing.js`
- `backend/tests/integration/addons.test.js`
- This document.

## Files modified

- `backend/prisma/schema.prisma`
- `backend/src/app.js`
- `backend/src/modules/bookings/checkout.service.js`
- `backend/src/modules/bookings/checkout.repository.js`
- `backend/src/modules/bookings/checkout.validation.js`
- `backend/src/modules/bookings/booking.read.service.js`
- `backend/tests/integration/checkout.test.js` (database fixtures replace environment-only fixtures)
- `backend/.env.example` (documents database-based configuration)
- `frontend/src/pages/Checkout.jsx`
- `frontend/src/components/booking/CheckoutVehicles.jsx`
- `frontend/src/components/booking/CheckoutTotals.jsx`
- `frontend/src/components/booking/PriceBreakdown.jsx`
- Ignored browser verification script `backend/.artifacts/checkout/verify.mjs` now creates database-backed test configuration in its disposable database.

No files deleted, packages installed, real vehicle images changed, or unrelated homepage/header/footer/admin pages redesigned.

## Verification

- Prisma client generation passed.
- Frontend build and ESLint passed.
- Full backend suite: 43/43 passed (9 new dynamic add-on tests plus the 34 existing/checkout tests).
- Browser script `node backend/.artifacts/checkout/verify.mjs`: listing Book Now -> existing checkout; two same-model physical units plus a car; two helmets using isolated database fixtures; complete backend total; real reservation; confirmation links; old booking URL alias; no runtime page errors.
- Browser no-overflow checks passed at 1440, 1024, 768, 390 and 320px in both themes.
- Tests exercise role authorization, CSRF, invalid input, duplicate codes, version conflicts, archive/audit retention, dynamic rate updates, historical snapshots, included-stock consumption, quantity/category limits, peak overlap, concurrent stock allocation, legacy helmet commitments, cancellation release and stale quote signatures.
- An initial test helper import used a nonexistent password utility path; it was corrected to the actual existing `utils/crypto.js` and the suite rerun successfully.

## Remaining phases

Phase 3 is the actual Admin dashboard UI: Add-on editor, dedicated Helmet view using the same editor, stock/limit/category controls, physical fleet/model mapping and image manager. These new screens are not present yet; API availability must not be mistaken for a completed Admin interface.

Later phases still include configurable discounts and vehicle-specific/versioned rental rules, independent equipment issue/return events, manual multi-item booking parity, a generic customer add-on selector, broader stock reports and any separately requested authenticated customer dashboard. No MongoDB migration was performed.
