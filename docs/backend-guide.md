# Backend guide

Runtime entry: `backend/src/server.js`. Express assembly: `backend/src/app.js`. Configuration: `backend/src/config`. Business modules own routes, controllers, services, repositories and request validation.

## Database access

The active API uses the official MongoDB Node.js driver. Configure `MONGODB_URI` privately in `backend/.env` and set `MONGODB_DB_NAME` to the intended database. The server connects and initializes required indexes before listening. It has no active SQLite fallback.

Use the shared booking service for website, phone and walk-in reservations. Keep database operations in repositories. Booking/checkout availability validation and writes must stay in the same transaction. Do not run concurrent MongoDB operations on one transaction session; use `queryGroup()` from `config/mongoDatabase.js` where a group can execute in parallel outside transactions but must execute sequentially inside one. Monetary values remain integer paise, and out-of-range integers fail instead of being rounded silently.

## Migration and tests

The source SQLite backup is read-only migration input. The one-time importer is preserved outside runtime at `archive/legacy-prisma-sqlite/scripts/migrate-sqlite-to-mongodb.mjs`; it is deliberately not exposed as an application npm command. When the operator is ready for a separately reviewed data migration, run it directly with Node against a verified backup and an isolated database first. It refuses conflicting documents and requires a separate explicit flag for the `riderent` target.

Run `npm --prefix backend run test:unit` for local Mongo helper unit tests. `npm --prefix backend run test:mongodb` runs database integration/concurrency tests in a generated `riderent_test_*` database and requires `MONGODB_URI`; it refuses to run with `NODE_ENV=production`. Do not run database tests against `riderent`.

## Sessions, OTP and uploads

Sessions use hashed tokens and HTTP-only cookies. Production requires HTTPS, exact HTTPS `APP_ORIGIN` values, trusted proxy configuration and a persistent `OTP_HASH_SECRET`; email delivery additionally needs the provider credentials. Uploads are separate files under the absolute `UPLOAD_DIR`; MongoDB migration does not move or persist those files. Choose durable storage before production deployment.

See `deployment.md` and `sqlite-to-mongodb-migration.md` for deployment, migration and rollback details. Historical Prisma/SQLite files are archived outside the active runtime; the original SQLite file and verified snapshot remain available for migration/rollback.
