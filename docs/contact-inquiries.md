# Contact form and admin inbox

The Contact form now saves inquiries to the existing SQLite database through `POST /api/contact`. It uses the existing apiClient/session/CSRF mechanism. Success appears only after a confirmed database response; failure retains form fields. No email is sent automatically.

## Customer flow

ContactForm.jsx submits name, email, optional phone, inquiryType (vehicle/booking/pickup/other), message and a random submissionKey through services/contactService.js. The backend contact module validates trimmed values, limits text lengths, and accepts at most five POST attempts per IP per 15 minutes. Existing global rate limits and CSRF remain active. A submission key prevents duplicate records after a retry; reusing it with changed content returns 409. Public responses contain only a receipt ID, never other customer details.

## Admin

Sign in as an administrator and open `/admin/inquiries`, or select Inquiries in the sidebar. The inbox displays 50 messages per page, with All/New/Read filters and Mark as read/new actions. Email/phone links open the appropriate client; they do not send an automatic reply. Private endpoints use admin authorization and no-store responses. Status changes are audited without copying the message into audit logs.

- GET `/api/admin/inquiries?status=all&offset=0`
- PATCH `/api/admin/inquiries/:id` with `{ "status": "read" }` or `new`

## Files

- frontend/src/components/contact/ContactForm.jsx/.css: UI, validation, busy and feedback states.
- frontend/src/services/contactService.js: submit API call.
- frontend/src/admin/pages/Inquiries.jsx/.css: admin inbox.
- frontend/src/admin/routes.jsx, components/AdminSidebar.jsx, config/adminNavigation.js: protected route and navigation.
- backend/src/modules/contact/contact.routes.js, contact.controller.js, contact.service.js, contact.repository.js, contact.validation.js: layered API, validation and persistence.
- backend/prisma/schema.prisma: ContactInquiry model.
- backend/prisma/migrations/0005_contact_inquiries/migration.sql: additive table and indexes.
- backend/tests/integration/contact.test.js: CSRF, validation, persistence, idempotency, rate limiting, admin protection/status and missing-table behavior.

## Database deployment

The running local preview uses `backend/.artifacts/preview/riderent.sqlite`. This preview database was backed up using SQLite backup to `backend/.artifacts/contact-redesign/preview-before-contact.sqlite`, then only migration 0005 was applied. Every pre-existing table was verified unchanged. The agency database under backend/data was not modified.

For another environment, take a SQLite-aware backup and use the existing project baseline/migration workflow before `npm run db:migrate`; do not seed or reset an existing database. This project can contain legacy databases without Prisma migration history, so do not run migrations blindly. Generate Prisma client and restart the API after deployment. If inquiry storage is not installed, the API returns an explicit temporary-unavailable error rather than claiming a message was delivered. The optional gallery migration is separate and was not applied to preview as part of enabling contact messages.

## Verification

29 backend integration tests passed on rerun. One initial run hit an existing time-sensitive rescheduling assertion; no booking code was changed. New browser coverage uses a disposable database and verifies real submit, admin inbox/read filters, failure retention and mobile layout. Contact messages in test databases are not real customer inquiries.
