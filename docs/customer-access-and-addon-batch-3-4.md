# Customer Access Security and Add-on Reservation Parity

## Customer access

- `POST /api/bookings/access/request` accepts a booking reference and email. For both matches and non-matches it returns the same `202` message and challenge-shaped response. Challenges for non-matches cannot verify.
- `POST /api/bookings/access/verify` accepts the challenge ID and six-digit code. Codes are HMAC-SHA256 digests, expire in ten minutes, are single-use, and allow five attempts. Request and verify endpoints have separate IP rate limits.
- A successful verification issues an eight-hour `HttpOnly`, `SameSite=Lax` customer cookie. It is scoped to the selected booking or its multi-vehicle checkout group. Booking IDs outside the scope are denied. Existing staff sessions and global API CSRF checks remain in place.
- New website bookings also get an eight-hour cookie scoped to only the newly created booking/order so their confirmation page works immediately. The client no longer stores reusable booking bearer tokens.
- The prior `POST /api/bookings/lookup` endpoint now returns `410`; it cannot be used to authorize a booking with reference + phone.
- Online bookings require an email so the owner can regain access after the initial browser session ends. Existing records are not rewritten. Records without a saved email cannot use email OTP and need shop-assisted account correction or a future SMS provider.

## OTP delivery and deployment

The delivery interface is `deliverBookingOtp` in `backend/src/modules/bookings/customerAccess.service.js`. Development logs the generated code to the backend console. Production sends via the Resend email API and requires:

- `RESEND_API_KEY`
- `OTP_FROM_EMAIL` (verified sender address in Resend)
- `OTP_HASH_SECRET` (unique random secret, at least 32 characters; keep stable across restarts)

Render variables are declared as unsynced secrets in `render.yaml`. Missing production configuration returns the same temporary-unavailable response for every OTP request. Provider credentials and live email delivery have not been configured or tested, so customer account recovery is not production-ready yet. SMS is not implemented.

## Add-on allocation

- Website multi-vehicle checkout quotes and reserves through `quoteAddOns` and `reserveAddOnAllocations` inside the existing SQLite write transaction.
- Legacy website bookings and staff/manual single-vehicle bookings now call those same pricing/allocation functions from `createBooking`.
- Configured included units reserve stock even when the booking selected no paid extras. Paid units are charged by the configured booking/hour rule. Snapshots stay on booking allocations; current add-on edits affect future quotes only.
- Cancellation changes booking status in the same inventory source, so `allocationWindows` releases the units. Existing legacy `booking_addons` records continue counting as helmet commitments.
- SQLite transactions use the app's serialized write queue and transaction lock before stock reads. This protects concurrent requests within this single-service SQLite deployment. Do not run multiple API writers against a shared SQLite file on different hosts.

## Database migration safety

Historical SQLite migration `archive/legacy-prisma-sqlite/prisma/migrations/0008_customer_access_security/migration.sql` adds two tables and indexes. It has **not** been applied to the original/business database in this work. This archived SQL migration is not used by the MongoDB runtime.

## Verification status

Test results for Batch 3/4 are reported in the completion message. Automated tests use isolated SQLite databases; no real OTP email was sent and no deployment was performed.
