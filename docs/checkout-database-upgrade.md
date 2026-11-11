# Checkout database repair — 10 November 2026

## Cause

The running API restarted against the configured `backend/data/riderent.sqlite` database. The previously upgraded preview database was a different file under `backend/.artifacts/preview/`. The configured database contained the original 20 vehicles and 12 bookings but lacked checkout/add-on tables, so the checkout installation guard returned the reported error.

## Repair performed

- Confirmed the running API inventory exactly matched the configured database before touching it.
- Rehearsed the upgrade on a SQLite-consistent copy.
- Created a SQLite-consistent backup of the configured database:
  `backend/.artifacts/backups/riderent.sqlite-2026-11-10T06-43-57.175Z-4de10393.sqlite`.
- Applied only the additive migrations `0006_checkout_orders` and `0007_dynamic_addons` in one explicit transaction.
- Verified hashes of every pre-existing table's rows remained unchanged and foreign-key checks passed.
- No booking, vehicle, payment, customer or configured price was reset or seeded. No records were copied from the separate preview database.

## Repeatable operator command

```text
node backend/scripts/upgrade-checkout.mjs --database backend/data/riderent.sqlite
```

The new script requires an explicit existing database path, backs up before applying missing tables, rejects partial installations and rolls back on failed row-hash/foreign-key verification. Running it again after a successful upgrade makes no changes. It never creates a missing database or resets existing data.

This is a targeted repair, not a reconciliation of the project's pre-existing Prisma migration-history drift. Do not assume `prisma migrate deploy` has been baselined by this command.

## Verification

- Upgrade-copy rehearsal and repeated-run no-op: passed.
- Two automated integration tests: passed (record preservation/idempotence and rejection of a partial installation).
- ESLint for the new script/tests: passed.
- Live API and frontend-proxied checkout catalogue: HTTP 200.
- Frontend-proxied quote: HTTP 200 with backend-calculated available quote.
- Live browser checkout: selected vehicle, availability and total loaded; confirmation enabled; no runtime page errors. No real booking submitted.
- Real database still contains 20 vehicles and 12 bookings; integrity check returned `ok`.
- No dummy helmet price or stock was inserted. Add-ons remain operator-configured.

## Files added

- `backend/scripts/upgrade-checkout.mjs`
- `backend/tests/integration/checkoutUpgrade.test.js`
- This document.

Browser evidence: `backend/.artifacts/checkout-upgrade/fixed.png`.
