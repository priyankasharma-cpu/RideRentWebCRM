# Contact form and admin inbox

> Database note: this feature now persists through the native MongoDB repository. Older SQLite/Prisma migration instructions below have been superseded; see `backend-guide.md` for the current runtime.

The Contact form saves inquiries through `POST /api/contact` to the MongoDB `contact_inquiries` collection. It uses the existing apiClient/session/CSRF mechanism. Success appears only after a confirmed database response; failure retains form fields. No email is sent automatically.

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
- backend/src/config/mongoDatabase.js: contact collection indexes.
- backend/tests/mongodb/: live MongoDB workflow coverage (requires an isolated configured test database).

## Database deployment

The active backend uses the MongoDB `contact_inquiries` collection and creates its indexes on server startup. No SQL migration or Prisma client generation is needed. Do not run the old SQLite instructions in archived project history.

## Verification

Historical tests passed against a disposable SQLite fixture before the backend conversion. Current live MongoDB inquiry workflow tests require Atlas credentials and are not yet verified.
