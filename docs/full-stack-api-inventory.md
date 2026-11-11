# RideRent API integration inventory — 5 November 2026

Root: `E:/piyasharmawebwork/MyDemoprojects/RideRentwebCRM`.

47 registered method/path combinations discovered from actual route files. All frontend calls go through same-origin `/api` with the shared API client unless noted. Session bootstrap uses fetch; Vite proxies development traffic to the backend. Non-GET requests require the current session CSRF token and allowed origin. All `/api/admin` routes require staff authentication; additional admin-only guards are listed below.

Status interpretation: **PASS — observed HTTP 2xx** means at least one actual isolated regression request succeeded; it is not proof every payload, validation branch or role combination passed. **NOT TESTED — successful request not captured** means the source was traced but no successful HTTP response was recorded in the audit tracer. The broader browser tests may exercise it; that evidence is stated separately, never assumed. Guest-boundary checks independently tried all 31 Admin route/method combinations and received 401.

The final traced regression run completed 43/43 tests. Additional isolated HTTP smoke requests supplied the remaining successful-path observations: all 47 registered method/path combinations have at least one observed 2xx response. This is smoke coverage, not exhaustive endpoint verification. The tracer records only method, normalized path and status, never tokens, credentials or payloads. One earlier interrupted trace is not counted as a complete test run.

## Shared contracts and safeguards

- Error contract is generally `{error: string}`. The API client throws a plain Error and discards HTTP status and extra structured fields; availability conflicts do not return counts.
- Customer booking reads/cancel/reschedule require the booking token or staff identity. Reference + phone lookup issues that token without OTP; see audit H5.
- Public creation and quote input are validated in services where route validation middleware is absent.
- Server state uses React Query; lists/quotes have different poll/fetch/cache semantics. Admin saves refetch local resources; customer quotes refresh independently.
- No customer OTP/dashboard, stable vehicle model/fleet CRUD, independent equipment issue/return or online gateway endpoints are registered.

## Endpoint inventory

### GET `/api/admin/addons`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401, 403. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/addons/addOn.routes.js:15` -> `addons` controller/service/repository.
- Frontend: Admin AddOnManagement / HelmetManagement / AddOnEditor -> services/addOnService.js.
- Authentication: Authenticated admin only.
- Request validation: addOnInput / updateAddOnInput / archiveAddOnInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Definitions, category rules, inventory summary; writes are versioned and audited. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: addons, addon_categories; historical addon_allocations retained.

### POST `/api/admin/addons`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 201, 400, 401, 403. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/addons/addOn.routes.js:16` -> `addons` controller/service/repository.
- Frontend: Admin AddOnManagement / HelmetManagement / AddOnEditor -> services/addOnService.js.
- Authentication: Authenticated admin only.
- Request validation: addOnInput / updateAddOnInput / archiveAddOnInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Definitions, category rules, inventory summary; writes are versioned and audited. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: addons, addon_categories; historical addon_allocations retained.

### PUT `/api/admin/addons/:id`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/addons/addOn.routes.js:17` -> `addons` controller/service/repository.
- Frontend: Admin AddOnManagement / HelmetManagement / AddOnEditor -> services/addOnService.js.
- Authentication: Authenticated admin only.
- Request validation: addOnInput / updateAddOnInput / archiveAddOnInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Definitions, category rules, inventory summary; writes are versioned and audited. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: addons, addon_categories; historical addon_allocations retained.

### POST `/api/admin/addons/:id/archive`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/addons/addOn.routes.js:18` -> `addons` controller/service/repository.
- Frontend: Admin AddOnManagement / HelmetManagement / AddOnEditor -> services/addOnService.js.
- Authentication: Authenticated admin only.
- Request validation: addOnInput / updateAddOnInput / archiveAddOnInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Definitions, category rules, inventory summary; writes are versioned and audited. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: addons, addon_categories; historical addon_allocations retained.

### GET `/api/admin/dashboard`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/analytics/analytics.routes.js:5` -> `analytics` controller/service/repository.
- Frontend: Admin Dashboard / Analytics -> useResource.
- Authentication: Authenticated staff/admin.
- Request validation: No write body. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Aggregated kpis, daily series, fleet/category/status summaries; all-history read. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: bookings, rentals, vehicles, payments/refunds and snapshots.

### GET `/api/admin/audit`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/audit/audit.routes.js:6` -> `audit` controller/service/repository.
- Frontend: Admin Settings AuditTrail -> useResource.
- Authentication: Authenticated admin only.
- Request validation: Admin role guard; no write body. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Audit record list; no customer mutation. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: audit.

### GET `/api/session`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200.
- Route: `backend/src/modules/auth/auth.routes.js:8` -> `auth` controller/service/repository.
- Frontend: AuthContext / authService / Admin Login; Staff and AccountSecurity -> apiClient.
- Authentication: Public; CSRF session needed for writes; route-specific rate limits where configured.
- Request validation: loginSchema; addStaffInput; changeStaffAccessInput; changePasswordInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Session user/csrf, staff list, or ok; cookie rotation and role enforcement. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: users, sessions, audit.

### POST `/api/login`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401.
- Route: `backend/src/modules/auth/auth.routes.js:9` -> `auth` controller/service/repository.
- Frontend: AuthContext / authService / Admin Login; Staff and AccountSecurity -> apiClient.
- Authentication: Public; CSRF session needed for writes; route-specific rate limits where configured.
- Request validation: loginSchema; addStaffInput; changeStaffAccessInput; changePasswordInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Session user/csrf, staff list, or ok; cookie rotation and role enforcement. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: users, sessions, audit.

### POST `/api/logout`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200.
- Route: `backend/src/modules/auth/auth.routes.js:10` -> `auth` controller/service/repository.
- Frontend: AuthContext / authService / Admin Login; Staff and AccountSecurity -> apiClient.
- Authentication: Public; CSRF session needed for writes; route-specific rate limits where configured.
- Request validation: loginSchema; addStaffInput; changeStaffAccessInput; changePasswordInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Session user/csrf, staff list, or ok; cookie rotation and role enforcement. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: users, sessions, audit.

### GET `/api/admin/staff`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401, 403. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/auth/staff.routes.js:13` -> `auth` controller/service/repository.
- Frontend: AuthContext / authService / Admin Login; Staff and AccountSecurity -> apiClient.
- Authentication: Authenticated admin only.
- Request validation: loginSchema; addStaffInput; changeStaffAccessInput; changePasswordInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Session user/csrf, staff list, or ok; cookie rotation and role enforcement. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: users, sessions, audit.

### POST `/api/admin/staff`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 201, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/auth/staff.routes.js:14` -> `auth` controller/service/repository.
- Frontend: AuthContext / authService / Admin Login; Staff and AccountSecurity -> apiClient.
- Authentication: Authenticated admin only.
- Request validation: loginSchema; addStaffInput; changeStaffAccessInput; changePasswordInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Session user/csrf, staff list, or ok; cookie rotation and role enforcement. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: users, sessions, audit.

### PATCH `/api/admin/staff/:id`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 400, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/auth/staff.routes.js:20` -> `auth` controller/service/repository.
- Frontend: AuthContext / authService / Admin Login; Staff and AccountSecurity -> apiClient.
- Authentication: Authenticated admin only.
- Request validation: loginSchema; addStaffInput; changeStaffAccessInput; changePasswordInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Session user/csrf, staff list, or ok; cookie rotation and role enforcement. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: users, sessions, audit.

### POST `/api/admin/change-password`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/auth/staff.routes.js:26` -> `auth` controller/service/repository.
- Frontend: AuthContext / authService / Admin Login; Staff and AccountSecurity -> apiClient.
- Authentication: Authenticated staff/admin.
- Request validation: loginSchema; addStaffInput; changeStaffAccessInput; changePasswordInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Session user/csrf, staff list, or ok; cookie rotation and role enforcement. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: users, sessions, audit.

### POST `/api/quote`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200.
- Route: `backend/src/modules/bookings/booking.routes.js:17` -> `bookings` controller/service/repository.
- Frontend: Checkout/useCheckout, VehicleDetails/useQuote, BookingConfirmation/useBookings, MyBookings, Admin CreateBooking/BookingManager.
- Authentication: Public; CSRF session needed for writes; route-specific rate limits where configured.
- Request validation: bookingSchema + rental window validation; lookupBookingInput; checkoutQuoteInput/checkoutReservationInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Quote; booking + token; booking view/list; checkout bookings array; errors. Legacy/manual allocation differs from checkout. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, bookings, booking_contacts, customers, checkout_orders/items, snapshots, payments/rentals.

### POST `/api/bookings`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 201, 400, 403, 409.
- Route: `backend/src/modules/bookings/booking.routes.js:18` -> `bookings` controller/service/repository.
- Frontend: Checkout/useCheckout, VehicleDetails/useQuote, BookingConfirmation/useBookings, MyBookings, Admin CreateBooking/BookingManager.
- Authentication: Public; CSRF session needed for writes; route-specific rate limits where configured.
- Request validation: bookingSchema + rental window validation; lookupBookingInput; checkoutQuoteInput/checkoutReservationInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Quote; booking + token; booking view/list; checkout bookings array; errors. Legacy/manual allocation differs from checkout. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, bookings, booking_contacts, customers, checkout_orders/items, snapshots, payments/rentals.

### POST `/api/bookings/lookup`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 404.
- Route: `backend/src/modules/bookings/booking.routes.js:19` -> `bookings` controller/service/repository.
- Frontend: Checkout/useCheckout, VehicleDetails/useQuote, BookingConfirmation/useBookings, MyBookings, Admin CreateBooking/BookingManager.
- Authentication: Public; CSRF session needed for writes; route-specific rate limits where configured.
- Request validation: bookingSchema + rental window validation; lookupBookingInput; checkoutQuoteInput/checkoutReservationInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Quote; booking + token; booking view/list; checkout bookings array; errors. Legacy/manual allocation differs from checkout. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, bookings, booking_contacts, customers, checkout_orders/items, snapshots, payments/rentals.

### GET `/api/bookings/:id`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 403.
- Route: `backend/src/modules/bookings/booking.routes.js:25` -> `bookings` controller/service/repository.
- Frontend: Checkout/useCheckout, VehicleDetails/useQuote, BookingConfirmation/useBookings, MyBookings, Admin CreateBooking/BookingManager.
- Authentication: Booking bearer token or authenticated staff.
- Request validation: bookingSchema + rental window validation; lookupBookingInput; checkoutQuoteInput/checkoutReservationInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Quote; booking + token; booking view/list; checkout bookings array; errors. Legacy/manual allocation differs from checkout. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, bookings, booking_contacts, customers, checkout_orders/items, snapshots, payments/rentals.

### POST `/api/bookings/:id/cancel`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200.
- Route: `backend/src/modules/bookings/booking.routes.js:26` -> `bookings` controller/service/repository.
- Frontend: Checkout/useCheckout, VehicleDetails/useQuote, BookingConfirmation/useBookings, MyBookings, Admin CreateBooking/BookingManager.
- Authentication: Booking bearer token or authenticated staff.
- Request validation: bookingSchema + rental window validation; lookupBookingInput; checkoutQuoteInput/checkoutReservationInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Quote; booking + token; booking view/list; checkout bookings array; errors. Legacy/manual allocation differs from checkout. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, bookings, booking_contacts, customers, checkout_orders/items, snapshots, payments/rentals.

### POST `/api/bookings/:id/reschedule`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200.
- Route: `backend/src/modules/bookings/booking.routes.js:27` -> `bookings` controller/service/repository.
- Frontend: Checkout/useCheckout, VehicleDetails/useQuote, BookingConfirmation/useBookings, MyBookings, Admin CreateBooking/BookingManager.
- Authentication: Booking bearer token or authenticated staff.
- Request validation: bookingSchema + rental window validation; lookupBookingInput; checkoutQuoteInput/checkoutReservationInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Quote; booking + token; booking view/list; checkout bookings array; errors. Legacy/manual allocation differs from checkout. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, bookings, booking_contacts, customers, checkout_orders/items, snapshots, payments/rentals.

### GET `/api/admin/bookings`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/bookings/booking.routes.js:28` -> `bookings` controller/service/repository.
- Frontend: Checkout/useCheckout, VehicleDetails/useQuote, BookingConfirmation/useBookings, MyBookings, Admin CreateBooking/BookingManager.
- Authentication: Authenticated staff/admin.
- Request validation: bookingSchema + rental window validation; lookupBookingInput; checkoutQuoteInput/checkoutReservationInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Quote; booking + token; booking view/list; checkout bookings array; errors. Legacy/manual allocation differs from checkout. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, bookings, booking_contacts, customers, checkout_orders/items, snapshots, payments/rentals.

### POST `/api/admin/bookings`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 201, 401, 409. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/bookings/booking.routes.js:29` -> `bookings` controller/service/repository.
- Frontend: Checkout/useCheckout, VehicleDetails/useQuote, BookingConfirmation/useBookings, MyBookings, Admin CreateBooking/BookingManager.
- Authentication: Authenticated staff/admin.
- Request validation: bookingSchema + rental window validation; lookupBookingInput; checkoutQuoteInput/checkoutReservationInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Quote; booking + token; booking view/list; checkout bookings array; errors. Legacy/manual allocation differs from checkout. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, bookings, booking_contacts, customers, checkout_orders/items, snapshots, payments/rentals.

### GET `/api/checkout/catalog`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200.
- Route: `backend/src/modules/bookings/checkout.routes.js:11` -> `bookings` controller/service/repository.
- Frontend: Checkout/useCheckout, VehicleDetails/useQuote, BookingConfirmation/useBookings, MyBookings, Admin CreateBooking/BookingManager.
- Authentication: Public; CSRF session needed for writes; route-specific rate limits where configured.
- Request validation: bookingSchema + rental window validation; lookupBookingInput; checkoutQuoteInput/checkoutReservationInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Quote; booking + token; booking view/list; checkout bookings array; errors. Legacy/manual allocation differs from checkout. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, bookings, booking_contacts, customers, checkout_orders/items, snapshots, payments/rentals.

### POST `/api/checkout/quote`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 409.
- Route: `backend/src/modules/bookings/checkout.routes.js:14` -> `bookings` controller/service/repository.
- Frontend: Checkout/useCheckout, VehicleDetails/useQuote, BookingConfirmation/useBookings, MyBookings, Admin CreateBooking/BookingManager.
- Authentication: Public; CSRF session needed for writes; route-specific rate limits where configured.
- Request validation: bookingSchema + rental window validation; lookupBookingInput; checkoutQuoteInput/checkoutReservationInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Quote; booking + token; booking view/list; checkout bookings array; errors. Legacy/manual allocation differs from checkout. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, bookings, booking_contacts, customers, checkout_orders/items, snapshots, payments/rentals.

### POST `/api/checkout/reserve`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 201, 403.
- Route: `backend/src/modules/bookings/checkout.routes.js:17` -> `bookings` controller/service/repository.
- Frontend: Checkout/useCheckout, VehicleDetails/useQuote, BookingConfirmation/useBookings, MyBookings, Admin CreateBooking/BookingManager.
- Authentication: Public; CSRF session needed for writes; route-specific rate limits where configured.
- Request validation: bookingSchema + rental window validation; lookupBookingInput; checkoutQuoteInput/checkoutReservationInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Quote; booking + token; booking view/list; checkout bookings array; errors. Legacy/manual allocation differs from checkout. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, bookings, booking_contacts, customers, checkout_orders/items, snapshots, payments/rentals.

### POST `/api/contact`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 201, 400, 403, 409, 429.
- Route: `backend/src/modules/contact/contact.routes.js:20` -> `contact` controller/service/repository.
- Frontend: ContactForm/contactService; Admin Inquiries/useResource.
- Authentication: Public; CSRF session needed for writes; route-specific rate limits where configured.
- Request validation: contactInput; inquiryListInput; inquiryStatusInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Receipt id; paginated inbox; status acknowledgement. No email-send claim. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: contact_inquiries, audit.

### GET `/api/admin/inquiries`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/contact/contact.routes.js:26` -> `contact` controller/service/repository.
- Frontend: ContactForm/contactService; Admin Inquiries/useResource.
- Authentication: Authenticated admin only.
- Request validation: contactInput; inquiryListInput; inquiryStatusInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Receipt id; paginated inbox; status acknowledgement. No email-send claim. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: contact_inquiries, audit.

### PATCH `/api/admin/inquiries/:id`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/contact/contact.routes.js:32` -> `contact` controller/service/repository.
- Frontend: ContactForm/contactService; Admin Inquiries/useResource.
- Authentication: Authenticated admin only.
- Request validation: contactInput; inquiryListInput; inquiryStatusInput. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Receipt id; paginated inbox; status acknowledgement. No email-send claim. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: contact_inquiries, audit.

### GET `/api/admin/customers`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/customers/customer.routes.js:7` -> `customers` controller/service/repository.
- Frontend: Admin Customers / customer lookup in CreateBooking -> useResource/apiClient.
- Authentication: Authenticated staff/admin.
- Request validation: verifyCustomerInput; path existence check. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Customers with booking data; verification ack. Verification means driving licence, not OTP. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: customers, booking_contacts and booking graph.

### PATCH `/api/admin/customers/:id`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/customers/customer.routes.js:8` -> `customers` controller/service/repository.
- Frontend: Admin Customers / customer lookup in CreateBooking -> useResource/apiClient.
- Authentication: Authenticated staff/admin.
- Request validation: verifyCustomerInput; path existence check. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Customers with booking data; verification ack. Verification means driving licence, not OTP. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: customers, booking_contacts and booking graph.

### GET `/api/admin/maintenance`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/maintenance/maintenance.routes.js:12` -> `maintenance` controller/service/repository.
- Frontend: Admin Maintenance -> useResource/apiClient.
- Authentication: Authenticated staff/admin.
- Request validation: scheduleMaintenanceInput + rentalWindow; resolve checks record existence. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Maintenance list/ack; conflict checks; resolves operational blocks. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: maintenance, vehicles, bookings, audit.

### POST `/api/admin/maintenance`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 201, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/maintenance/maintenance.routes.js:13` -> `maintenance` controller/service/repository.
- Frontend: Admin Maintenance -> useResource/apiClient.
- Authentication: Authenticated admin only.
- Request validation: scheduleMaintenanceInput + rentalWindow; resolve checks record existence. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Maintenance list/ack; conflict checks; resolves operational blocks. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: maintenance, vehicles, bookings, audit.

### POST `/api/admin/maintenance/:id/resolve`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/maintenance/maintenance.routes.js:19` -> `maintenance` controller/service/repository.
- Frontend: Admin Maintenance -> useResource/apiClient.
- Authentication: Authenticated admin only.
- Request validation: scheduleMaintenanceInput + rentalWindow; resolve checks record existence. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Maintenance list/ack; conflict checks; resolves operational blocks. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: maintenance, vehicles, bookings, audit.

### POST `/api/admin/bookings/:id/payments`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 400, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/payments/payment.routes.js:12` -> `payments` controller/service/repository.
- Frontend: Admin PaymentForm / BookingLedger / Payments -> apiClient.
- Authentication: Authenticated staff/admin.
- Request validation: recordPaymentInput; refundPaymentInput; server balance/state checks. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Updated booking ledger or ok; integer paise; refunds admin-only. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: payments, refunds, bookings, audit.

### POST `/api/admin/payments/:id/refund`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 400, 401, 403. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/payments/payment.routes.js:17` -> `payments` controller/service/repository.
- Frontend: Admin PaymentForm / BookingLedger / Payments -> apiClient.
- Authentication: Authenticated admin only.
- Request validation: recordPaymentInput; refundPaymentInput; server balance/state checks. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Updated booking ledger or ok; integer paise; refunds admin-only. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: payments, refunds, bookings, audit.

### GET `/api/admin/payments`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/payments/payment.routes.js:23` -> `payments` controller/service/repository.
- Frontend: Admin PaymentForm / BookingLedger / Payments -> apiClient.
- Authentication: Authenticated staff/admin.
- Request validation: recordPaymentInput; refundPaymentInput; server balance/state checks. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Updated booking ledger or ok; integer paise; refunds admin-only. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: payments, refunds, bookings, audit.

### POST `/api/admin/bookings/:id/pickup`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401, 409. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/rentals/rental.routes.js:11` -> `rentals` controller/service/repository.
- Frontend: Admin BookingActions / RentalInspectionForm / RentalCompletionForm.
- Authentication: Authenticated staff/admin.
- Request validation: pickUpRentalInput; returnRentalInput; completeRentalInput + lifecycle checks. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Updated booking view with actual pickup/return and inspection/balance state. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: rentals, inspections, bookings, vehicles, maintenance, audit.

### POST `/api/admin/bookings/:id/return`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/rentals/rental.routes.js:16` -> `rentals` controller/service/repository.
- Frontend: Admin BookingActions / RentalInspectionForm / RentalCompletionForm.
- Authentication: Authenticated staff/admin.
- Request validation: pickUpRentalInput; returnRentalInput; completeRentalInput + lifecycle checks. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Updated booking view with actual pickup/return and inspection/balance state. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: rentals, inspections, bookings, vehicles, maintenance, audit.

### POST `/api/admin/bookings/:id/complete`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401, 409. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/rentals/rental.routes.js:21` -> `rentals` controller/service/repository.
- Frontend: Admin BookingActions / RentalInspectionForm / RentalCompletionForm.
- Authentication: Authenticated staff/admin.
- Request validation: pickUpRentalInput; returnRentalInput; completeRentalInput + lifecycle checks. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Updated booking view with actual pickup/return and inspection/balance state. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: rentals, inspections, bookings, vehicles, maintenance, audit.

### GET `/api/settings`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200.
- Route: `backend/src/modules/settings/settings.routes.js:8` -> `settings` controller/service/repository.
- Frontend: ShopContext; Admin ShopSettingsForm -> apiClient.
- Authentication: Public; CSRF session needed for writes; route-specific rate limits where configured.
- Request validation: updateShopSettingsInput for writes. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Shop JSON configuration; admin save persists whole validated shape. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: settings, audit.

### PUT `/api/admin/settings`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401, 403. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/settings/settings.routes.js:9` -> `settings` controller/service/repository.
- Frontend: ShopContext; Admin ShopSettingsForm -> apiClient.
- Authentication: Authenticated admin only.
- Request validation: updateShopSettingsInput for writes. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Shop JSON configuration; admin save persists whole validated shape. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: settings, audit.

### POST `/api/admin/uploads`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 201, 400, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/uploads/upload.routes.js:7` -> `uploads` controller/service/repository.
- Frontend: Admin VehicleEditor upload -> apiClient FormData.
- Authentication: Authenticated admin only.
- Request validation: Admin role, multer one-file/4MB limit, signature checks. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Uploaded local image URL. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: backend/uploads; no vehicle record is updated until saved.

### GET `/api/vehicles`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200.
- Route: `backend/src/modules/vehicles/vehicle.routes.js:16` -> `vehicles` controller/service/repository.
- Frontend: useVehicles/vehicleService; Admin VehicleManagement/VehicleEditor; VehicleGallery.
- Authentication: Public; CSRF session needed for writes; route-specific rate limits where configured.
- Request validation: vehicleSchema for writes; vehicleGalleryInput for gallery; rentalWindow when list dates supplied. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Physical-unit records with derived state, optional date boolean and images. No model total/available counts. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, maintenance, bookings, vehicle_images, audit.

### GET `/api/vehicles/:slug`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 404.
- Route: `backend/src/modules/vehicles/vehicle.routes.js:17` -> `vehicles` controller/service/repository.
- Frontend: useVehicles/vehicleService; Admin VehicleManagement/VehicleEditor; VehicleGallery.
- Authentication: Public; CSRF session needed for writes; route-specific rate limits where configured.
- Request validation: vehicleSchema for writes; vehicleGalleryInput for gallery; rentalWindow when list dates supplied. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Physical-unit records with derived state, optional date boolean and images. No model total/available counts. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, maintenance, bookings, vehicle_images, audit.

### GET `/api/admin/vehicles`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/vehicles/vehicle.routes.js:18` -> `vehicles` controller/service/repository.
- Frontend: useVehicles/vehicleService; Admin VehicleManagement/VehicleEditor; VehicleGallery.
- Authentication: Authenticated staff/admin.
- Request validation: vehicleSchema for writes; vehicleGalleryInput for gallery; rentalWindow when list dates supplied. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Physical-unit records with derived state, optional date boolean and images. No model total/available counts. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, maintenance, bookings, vehicle_images, audit.

### POST `/api/admin/vehicles`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 201, 401, 403, 409. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/vehicles/vehicle.routes.js:19` -> `vehicles` controller/service/repository.
- Frontend: useVehicles/vehicleService; Admin VehicleManagement/VehicleEditor; VehicleGallery.
- Authentication: Authenticated admin only.
- Request validation: vehicleSchema for writes; vehicleGalleryInput for gallery; rentalWindow when list dates supplied. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Physical-unit records with derived state, optional date boolean and images. No model total/available counts. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, maintenance, bookings, vehicle_images, audit.

### PUT `/api/admin/vehicles/:id`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 400, 401. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/vehicles/vehicle.routes.js:25` -> `vehicles` controller/service/repository.
- Frontend: useVehicles/vehicleService; Admin VehicleManagement/VehicleEditor; VehicleGallery.
- Authentication: Authenticated admin only.
- Request validation: vehicleSchema for writes; vehicleGalleryInput for gallery; rentalWindow when list dates supplied. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Physical-unit records with derived state, optional date boolean and images. No model total/available counts. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, maintenance, bookings, vehicle_images, audit.

### PUT `/api/admin/vehicles/:id/images`

- Status: **PASS — observed HTTP 2xx**. Traced statuses: 200, 400, 401, 403. Guest denial: **PASS (401)**.
- Route: `backend/src/modules/vehicles/vehicle.routes.js:31` -> `vehicles` controller/service/repository.
- Frontend: useVehicles/vehicleService; Admin VehicleManagement/VehicleEditor; VehicleGallery.
- Authentication: Authenticated admin only.
- Request validation: vehicleSchema for writes; vehicleGalleryInput for gallery; rentalWindow when list dates supplied. Exact schema is in the module validation file; quote/schedule dates are normalized by rentalWindow().
- Response/error/state: Physical-unit records with derived state, optional date boolean and images. No model total/available counts. Errors propagate to existing ErrorBox/form states; identified stale availability exception is in H4.
- Database operations: vehicles, maintenance, bookings, vehicle_images, audit.

## Additional executed browser evidence

- `workflow.log`: customer quote/reserve/confirmation, staff licence/payment/pickup/return/inspection/refund and manual cancellation reached PASS checkpoints; the full command ultimately FAILS at a stale mobile menu selector.
- `admin-ui.log`: Helmets/Add-ons create/edit/save/reload, billing/rates, pause/enable, generic archive, stale editor/version rejection, staff restrictions and theme/mobile checks PASS.
- `probes.json`: unknown availability, dates lost to details, zero-stock quantity 1, 409 response shape, token lookup behavior, legacy add-on bypass and stale quote action were directly reproduced.

## Limits

This inventory is a traceable integration review, not a claim that all possible successful and failing payloads of all 47 endpoints have been exhaustively tested. Any endpoint marked NOT TESTED needs a focused successful HTTP case before that endpoint can be called verified. Review the main audit for workflow/security requirements not met by a superficially successful 2xx response.
