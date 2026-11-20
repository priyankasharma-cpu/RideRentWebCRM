# MongoDB collections and data model

The active database uses the official MongoDB Node.js driver. Connection pooling, collection helpers, transaction sessions and index initialization are centralized in `backend/src/config/mongoDatabase.js`. The former Prisma schema and SQL migration history are preserved outside the runtime in `archive/legacy-prisma-sqlite/`.

Collections retain the previous relational table names and snake_case fields to keep application/API mappings stable. The active collection families include:

- `users`, `sessions`, `customers`, `customer_access_sessions`, `booking_access_challenges`
- `vehicles`, `vehicle_images`, `maintenance`
- `bookings`, `booking_contacts`, `checkout_orders`, `checkout_items`, `booking_addons`, `addon_allocations`, `addon_categories`, `addons`
- `rentals`, `inspections`, `payments`, `refunds`, `audit`, `settings`, `contact_inquiries`

MongoDB `_id` values mirror application IDs for normal records; compound-key records use stable composite IDs. Monetary amounts are integer paise. Dates continue to use the existing ISO timestamp representation at the API boundary. Booking-time rates and totals remain saved on booking records so later pricing edits do not rewrite history.

`mongoDatabase.js` initializes unique ID, booking reference, user email, customer phone, vehicle slug/registration, add-on code, session token, checkout idempotency, gallery ordering and related query indexes. Booking, checkout and inventory allocation writes use MongoDB transactions and a shared lock document. These transaction/index behaviors still require isolated Atlas rehearsal before production use.

No schema reset, Prisma migration or SQLite mutation is part of active startup. See `sqlite-to-mongodb-migration.md` for source preservation and the separately managed import plan.
