# Unified admin management and dynamic checkout

## Inspection findings and scope

The application uses React/Vite, Express and Prisma with SQLite. `HelmetManagement.jsx` was only a wrapper rendering `AddOnManagement` with a helmet filter. Both routes fetched `/api/admin/addons` and opened the same `AddOnEditor`. Duplicate navigation was unnecessary; the inventory/pricing engine was already shared.

The checkout catalog already returned generic enabled add-ons. Quote and reservation validation already accepted an `addOns` array. Backend pricing already calculated included items, paid extras, billing duration, integer-paise prices, taxes and overlapping stock, and persisted historical allocation snapshots. The missing integration was the customer selection UI and request payload.

Vehicle management currently edits physical vehicle records, including hourly rates, deposits and operational status. There is no stable VehicleModel relationship, daily-rate schedule or discount-rule model. The sidebar deliberately does not advertise those unsupported modules. A separate reviewed model/pricing phase remains necessary.

## Existing versus updated structure

Previously: one flat sidebar with separate Helmets and Add-ons entries; a filtered helmet page; a customer checkout with a dedicated helmet selector.

Now the sidebar has these groups, preserving existing working routes:

- Overview: Dashboard.
- Fleet Management: Physical Fleet & Pricing, Fleet Availability, Maintenance.
- Rental Management: Bookings, Create Booking, Active Rentals, Returns, Customers, Payments.
- Pricing & Inventory: Helmets & Add-ons.
- Business Management: Inquiries, Reports & Analytics, Staff & Roles, Settings.

`frontend/src/config/adminNavigation.js` owns the groups, labels, routes and link permissions. Header breadcrumbs consume the flattened list from the same configuration. Administrator-only links are filtered by route identity, not by display label. Existing protected routes and backend role checks remain in force. Staff retain their existing rental-operation access.

## Unified Helmets & Add-ons page

The canonical URL is `/admin/addons`. `/admin/helmets` redirects with history replacement to that URL after the existing authorization check. It does not call a write API or create any record.

Helmet Settings is pinned at the top, outside the accessory search/status filters. It shows the existing `code: helmet` record. If missing, Configure Helmets opens the shared editor with that code preset. Other Add-ons lists every other accessory below it, with search/status filtering and Add Add-on. Existing Edit, Pause/Enable and accessory Archive actions remain.

All records reuse `AddOnEditor`, `addOnService` and the existing backend. A duplicate code is rejected server-side. No second helmet record, pricing algorithm or stock pool was introduced. The obsolete HelmetManagement wrapper was deleted after its only import was replaced.

### Form fields

- Name: customer-facing accessory name.
- Unique code: permanent unique identifier; `helmet` is the existing helmet identifier. Existing codes are read-only.
- Rental price: rupee price of one paid extra unit. The frontend converts it to integer paise for the API.
- Billing type: once per booking or per billable rental hour.
- Total stock: actual quantity owned. Do not manually subtract reservations here.
- Damaged/unavailable stock: part of total stock that cannot be rented.
- Maximum units per checkout: included plus paid units across the entire booking, not per vehicle.
- Eligible categories: categories allowed to use that accessory.
- Included per vehicle: free items for each selected eligible physical unit. Free items still reserve stock.
- Enable new rentals: controls new availability; existing booking snapshots remain.
- Description/image URL: editable accessory information; the existing URL validation applies. This is not a new upload service.

The form now includes short guidance for price, billing and stock. Input accessible names remain explicit and keyboard behavior is preserved.

## Customer checkout flow

1. Rental dates remain in the existing URL-backed rental-period state.
2. `useCheckout` requests `/api/checkout/catalog` with the validated interval. Its `addOns` collection is the source of available options.
3. `checkoutAddOnSelections` matches selected positive vehicle quantities to each add-on's category rules. Disabled or ineligible options are excluded.
4. Included units are summed per physical vehicle. The paid-extra maximum is `max(0, min(available, maxQuantity) - included)`.
5. `CheckoutAddOns` renders one reusable control for each eligible accessory. It displays included quantity, pricing unit, available stock and the remaining paid-extra limit. There is no per-accessory pricing implementation in JSX.
6. React state stores paid quantities by add-on ID. Removing vehicles, changing categories or a verified stock/configuration update clamps/removes selections that no longer apply. During a pending availability request presentation state remains visible; increments and confirmation are blocked.
7. Quotes send `items` and `addOns: [{ addOnId, quantity }]`, where quantity means **paid extra quantity**. Included quantities are calculated authoritatively by the backend. Checkout does not send a second `helmets` selection for the same item.
8. Quote requests use the existing debounced/abortable query mechanism. Changing vehicles, dates or extras invalidates the visible quote. Pending amounts are dashes; failed quotes cannot enable confirmation.
9. Reservation sends the effective selections, server quote signature and expected total through the existing CSRF-protected endpoint. The server recalculates everything in its transaction.
10. `CheckoutTotals` shows all included and paid accessories. Existing saved allocation rendering shows quantities/charges in customer confirmation, booking details and admin BookingCharges. Historical rates remain unchanged after editing an add-on.

If included units alone exceed available stock or the checkout limit, the selector explains the capacity problem and the server rejects the quote. No fake extra inventory is created. Catalog refresh runs every 30 seconds; an explicit retry or page refresh obtains updated configuration sooner. Final reservation always validates again.

## Actual API and data dependencies

Frontend administration:

- `frontend/src/admin/pages/AddOnManagement.jsx`
- `frontend/src/admin/features/addons/AddOnCard.jsx` and `AddOnEditor.jsx`
- `frontend/src/services/addOnService.js` → existing `apiClient.js`
- GET/POST `/api/admin/addons`, PUT `/api/admin/addons/:id`, POST `/api/admin/addons/:id/archive`.

Customer flow:

- `frontend/src/pages/Checkout.jsx`
- `frontend/src/hooks/useCheckout.js` → `useFreshQuote.js` → `apiClient.js`
- `frontend/src/utils/checkoutSelections.js`
- `frontend/src/components/booking/CheckoutVehicles.jsx`, `CheckoutAddOns.jsx`, `CheckoutTotals.jsx`.
- GET `/api/checkout/catalog`, POST `/api/checkout/quote`, POST `/api/checkout/reserve`.

Backend, reused without changes in this batch:

- `backend/src/modules/addons/addOn.routes.js`, `.controller.js`, `.service.js`, `.repository.js`, `.validation.js`, `.inventory.js`, `.pricing.js`.
- `backend/src/modules/bookings/checkout.routes.js`, `.validation.js`, `.service.js`, `.repository.js`.
- `backend/src/modules/bookings/pricing.service.js`, `booking.read.service.js`, `booking.presenter.js`.
- `backend/src/config/database.js`; `backend/prisma/schema.prisma`.

Existing AddOn, AddOnCategory and AddOnAllocation records supply settings and snapshots. Physical Vehicle and Booking records remain intact. No API contract, schema, migration, database record, dependency or storage provider was changed for this implementation. Legacy API callers can still use the backward-compatible `helmets` field.

## Pricing controls and limitations

- Hourly rates and deposits: Physical Fleet & Pricing → edit the actual vehicle. All authoritative quotes use the backend price service.
- Tax, billing blocks, rental duration/grace rules and shop contact configuration: existing Settings, with existing administrator permissions.
- Additional/late charges and offline payment operations: existing booking/rental management workflows; unchanged here.
- Active/inactive vehicle status: existing vehicle editor; paused add-on status: unified page.
- Daily packages, discounts, scheduled prices/effective dates and model-wide pricing: **not implemented**. There are no existing data fields/rules for these. A future pricing design must specify discount eligibility, stacking, rounding, effective intervals, cancellation behavior and migration before implementation.
- Stable VehicleModel/VehicleUnit separation is still pending a reviewed migration. Existing checkout's exact-specification grouping remains unchanged. See `quantity-controls-2026-11-10.md` for the compatible proposal.
- Legacy separate `/booking` scaffolding was preserved. This batch integrates the actual card-to-`/checkout` flow; it does not claim to finish every alternative booking scaffold or OTP/customer dashboard.
- Equipment issue/return reconciliation remains a later workflow; stock currently accounts for reservations and active/inspecting rentals using existing allocation records.

## Files changed

Modified:

- `frontend/src/config/adminNavigation.js`
- `frontend/src/admin/components/AdminSidebar.jsx`
- `frontend/src/admin/routes.jsx`
- `frontend/src/admin/pages/AddOnManagement.jsx`
- `frontend/src/admin/pages/AddOnManagement.css`
- `frontend/src/admin/features/addons/AddOnEditor.jsx`
- `frontend/src/hooks/useCheckout.js`
- `frontend/src/pages/Checkout.jsx`
- `frontend/src/utils/checkoutSelections.js`
- `frontend/src/components/booking/CheckoutVehicles.jsx`
- `frontend/src/components/booking/CheckoutVehicles.css`
- `frontend/src/components/booking/CheckoutTotals.jsx`
- `frontend/src/components/booking/BookingForm.jsx`
- `backend/tests/e2e/admin-addons.mjs`
- `backend/tests/e2e/workflow.mjs` (intentional navigation label selector).

Created:

- `frontend/src/admin/features/addons/AddOnCard.jsx` and `.css`.
- `frontend/src/components/booking/CheckoutAddOns.jsx` and `.css`.
- `frontend/tests/dynamicAddOns.test.js`.
- This guide.

Deleted: `frontend/src/admin/pages/HelmetManagement.jsx`, a now-unused filtered wrapper. Its old URL remains supported by redirect. No business records were deleted.

## Verification

Tests run only against disposable databases, temporary accounts and test prices/stock. No live booking or admin configuration write was performed. A read-only check of the shop database showed 20 physical vehicles, 12 bookings and one existing helmet/add-on record.

Commands: `npm run lint`, `npm run build`, `npm test`, `node --test frontend/tests/*.test.js`, `npm run test:ui`, `node backend/tests/e2e/availability.mjs`, `node backend/tests/e2e/admin-addons.mjs`.

Execution results:

- PASS — lint, Vite production build and formatting checks for every file in this batch.
- PASS — all 16 frontend tests, including generic category eligibility, included/paid limits, disabled/missing options, pending quantities, unique sidebar routes and staff visibility.
- PASS — all 45 backend integration tests. These cover generic included/paid add-ons, snapshots after rate changes, overlapping reservations, concurrent overselling protection, transaction rollback, stock reductions, legacy bookings, CSRF and role authorization.
- PASS — full existing UI workflow: customer booking and lookup; admin pickup/return, inspection, receipts/refunds; phone booking/cancellation; existing admin views and mobile navigation.
- PASS — availability regression browser suite: URL dates, refresh/back/forward, zero stock, targeted quantity changes during catalog loading, old quote isolation, quote failures/retry and single/multi-unit reservations.
- PASS — unified admin/add-on browser suite: old helmet URL redirect, one sidebar entry, same helmet record ID/count, create/edit/persistence, generic accessory visibility and eligibility, paid quantity cap, pause/enable, customer/admin saved quantities, unchanged confirmed accessory charges after rate edit, search/archive/conflict handling and staff restrictions.
- PASS — admin/editor checks at 1440/1024/768/390/320px; generic accessory checkout at 1440/768/390/320px in light and dark themes. No detected horizontal overflow or captured runtime errors. The mobile generic checkout and desktop grouped sidebar screenshots were visually inspected.
- NOT TESTED — physical Android/iOS browsers, deployment load testing, unsupported model-wide/daily/discount workflows and equipment handover reconciliation.

Evidence is generated under ignored `backend/.artifacts/admin-addons`, `backend/.artifacts/availability-fixes` and `backend/.artifacts/screenshots`. Node emitted its existing experimental SQLite warning; no assertion failed in these runs.

# Historical SQLite implementation notes

> This dated plan refers to the earlier Prisma/SQLite backend. Current persistence uses MongoDB; see `backend-guide.md` and `database-schema.md` before changing the active API.
