# Booking, payment and return visibility

## What existed and why the status was confusing

The database and APIs already stored payment receipts/refunds, rental charges, deposits, scheduled dates, actual pickup/return timestamps and return inspections. The UI mostly displayed the operational booking status (`confirmed`, `active`, `inspecting`, `completed`). Confirmation therefore appeared even when no money had been received. Payment amounts were shown lower down, but there was no clear separate payment capsule.

Rental duration was displayed as raw billed hours. Backend overdue checks existed for active rentals, but the dashboard's notification was visually subdued. A customer confirmation did not poll for shop updates, and an open admin Manage dialog held its initial snapshot. There was no explicit green return badge distinct from inspection completion.

## Behavior now

- Confirmed booking: green Confirmed capsule, independent payment capsule.
- No receipts against outstanding charges: Payment pending.
- Some money received but rental charges or required deposit remain: Part payment · Balance pending.
- Rental and required deposit both settled: Payment done, in green.
- Cancelled bookings with money still held: Refund pending; after no money remains due/held: No payment due. Cancelled bookings are not falsely marked paid.
- Actual vehicle return saved: Returned to shop, in green, even while final inspection is still pending.
- Active rental at or beyond its scheduled end, without an actual return: red Time ended · Not returned capsule and detailed notice.
- Confirmed booking whose end has passed but pickup was never recorded: Time ended · Pickup not recorded, in amber. This is deliberately not labelled an overdue physical vehicle.

The dashboard shows a red pastel overdue notification using the existing authoritative overdue count. Bookings/Active Rentals/Returns show a detailed red notification and Show overdue rentals action. The existing Overdue filter is preserved; Expired additionally filters uncollected expired bookings.

Dates display in the existing India-local format. Scheduled duration is shown as days/hours/minutes in admin rows, Manage details and the customer confirmation/lookup detail page. Examples: 4 hours, 1 day, 2 days, 10 days, 30 days. Calendar months are not assumed to always contain 30 days. The current shop configuration allows at most 30 days; this implementation does not silently change that policy or billing rounding.

## Shop workflow

1. A website booking reserves inventory and shows Confirmed + Payment pending. Confirmation does not mean a receipt exists.
2. When the customer pays at pickup, open Bookings → Manage → Record Payment. Record the actual received rental amount with its method. Record the security deposit under its own Payment purpose. Partial receipts are supported. The UI turns green only after all currently required charges are covered.
3. Verify the driving licence and use Mark as Picked Up → Save Pickup Inspection. This records the actual handover and starts the active rental.
4. If the agreed return time passes while the vehicle is still out, the red notification appears automatically. Contact the customer; do not mark a vehicle returned merely to dismiss the alert.
5. When the customer delivers the vehicle back to the shop, use Mark as Returned → enter odometer/condition → Save Return Inspection. Both sides now show Returned to shop and the actual return timestamp. The overdue flag stops.
6. Any existing late fee or additional charge can create a new balance. Record that receipt, then Complete Inspection & Close. Deposit refunds remain a separate recorded action. Return, payment settlement, inspection completion and deposit refund are distinct events.

There is no automatic bank/UPI reconciliation: Record Payment records a shop receipt, as before. No new payment gateway was introduced. In this workflow the user's word “delivered” means the vehicle has been returned to the rental shop, not outbound vehicle delivery.

## Implementation and refresh behavior

`backend/src/modules/bookings/booking.status.js` derives `paymentState`, `rentalState` and `overdue` from authoritative receipt totals and actual timestamps. `booking.presenter.js` adds these fields without removing existing fields. No status flags were added to the database; there is no migration or historical-price rewrite.

`BookingStatusSummary` renders shared capsules; `BookingTimingNotice` renders the explanatory expiry/overdue notice. `RentalDeadlineAlert` is the admin list notification. `rentalDuration` formats the scheduled interval only; price calculations and historical billable hours stay on the backend unchanged.

Admin lists refresh at their existing 10-second interval; the dashboard refreshes every 15 seconds. Customer booking details and open admin Manage dialogs now poll every 15 seconds while visible and refresh on focus. They may take that long to reflect another operator's update. These are in-app notices, not OS push, SMS or email notifications.

Query updates cancel an older in-flight read before accepting a mutation result. Customer reschedule inputs only reset when the actual saved dates change, so background receipt refreshes do not overwrite an unfinished date edit. Existing booking-token/customer access and staff/admin authorization remain in place.

## Exact files

Created:

- `backend/src/modules/bookings/booking.status.js`
- `frontend/src/utils/bookingStatus.js`
- `frontend/src/components/booking/BookingStatusSummary.jsx`
- `frontend/src/components/booking/BookingStatusSummary.css`
- `frontend/src/admin/features/bookings/RentalDeadlineAlert.jsx`
- `frontend/src/admin/features/bookings/RentalDeadlineAlert.css`
- `backend/tests/integration/bookingStatus.test.js`
- `backend/tests/e2e/booking-status.mjs`
- `frontend/tests/bookingStatus.test.js`
- This guide.

Modified:

- `backend/src/modules/bookings/booking.presenter.js`
- `frontend/src/components/booking/BookingSuccess.jsx`
- `frontend/src/admin/features/bookings/BookingHeader.jsx`
- `frontend/src/admin/components/BookingTable.jsx`
- `frontend/src/admin/features/bookings/BookingManager.jsx`
- `frontend/src/pages/BookingConfirmation.jsx`
- `frontend/src/hooks/useBookings.js`
- `frontend/src/admin/features/bookings/useBookingManager.js`
- `frontend/src/admin/pages/BookingManagement.jsx`
- `frontend/src/admin/pages/Dashboard.jsx`
- `frontend/src/admin/pages/Dashboard.css`
- `backend/tests/e2e/admin-typography.mjs` (allow content-driven rows for the new duration/payment lines; assert their presence and red notification styling).

No files deleted. No Prisma schema, pricing, allocation, payment write, pickup/return write or refund rules changed. No production booking/payment/return record was changed for testing. The local API was restarted to load the compatible new response fields.

## Validation

Commands: `npm run lint`, `npm run build`, `npm test`, `node --test frontend/tests/*.test.js`, `node --test backend/tests/integration/bookingStatus.test.js`, `node backend/tests/e2e/booking-status.mjs`, `npm run test:ui`, `node backend/tests/e2e/admin-typography.mjs`.

The browser scenario uses separate customer/admin contexts and a disposable database. It records actual receipts, pickup and return through the admin UI. Elapsed-time behavior is simulated only by chronological timestamp changes in that isolated fixture; no live booking is backdated. Screenshots are stored under ignored `backend/.artifacts/booking-status/`.

Executed results:

- PASS: application lint, Vite build and formatting checks for changed files.
- PASS: all 49 backend integration tests; the four new status/receipt tests were also rerun after the status helper readability cleanup.
- PASS: all 18 frontend tests, including 4-hour, 1-day, 2-day, 10-day and 30-day formatting and invalid-duration handling.
- PASS: dedicated browser workflow for live pending/partial/paid badges on both sides, separate deposit receipts, pickup, elapsed rental/overdue notification, persisted actual return, final inspection and customer auto-refresh. Unfinished customer reschedule edits survived payment polling.
- PASS: existing full booking workflow, including admin payment, pickup/return, inspection, deposit refund, cancellation and customer lookup.
- PASS: admin typography/responsive suite across 1920/1440/1280/1024/768/390/320px, including both themes, visible duration/payment information, scoped table scrolling and red dashboard notification styling. No captured console/runtime errors in that suite.
- During verification, the browser test's login navigation wait was corrected, the old returned-booking success heading was updated, and narrow laptop badge wrapping was fixed rather than allowing excessively tall rows.
- NOT TESTED: physical Android/iOS devices, screen-reader certification or external payment reconciliation. There is no bank gateway or OS push-notification integration in this batch.

The local API and frontend were available after restart. A live record was inspected read-only to confirm the new derived fields; no live receipt, pickup or return was created/modified by these tests. The SQLite experimental-runtime message is an existing Node warning, not a failed assertion.
