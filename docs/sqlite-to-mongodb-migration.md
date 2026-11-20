# RideRent SQLite to MongoDB Migration

## Scope and current architecture

The initial backend was Node.js + Express with SQLite accessed through Prisma 7 and `@prisma/adapter-better-sqlite3`. The active server and repositories now use the official MongoDB driver via `backend/src/config/mongoDatabase.js`. Historical Prisma schema/migrations and the old SQLite test harness are preserved outside the runtime in `archive/legacy-prisma-sqlite/`. The importer is also archived there and is not part of application startup or npm application commands.

The frontend talks to Express routes and should keep its existing API contracts. The database migration is therefore a backend-only port unless a verified compatibility issue requires a narrow client change.

## Repository dependency map

```text
React customer/admin pages
  -> frontend services / API client
  -> Express routes and middleware (`backend/src/app.js`)
  -> controllers
  -> domain services
  -> MongoDB-backed repositories
  -> backend/src/config/mongoDatabase.js
       -> native MongoClient + connection pool
       -> replica-set transaction + shared write-queue document
```

The active MongoDB repositories include add-ons, analytics, audit, auth/session, auth/staff, availability, bookings, booking access, booking graph, checkout, contact, customers, maintenance, maintenance service records, payments, rentals, settings, vehicles, vehicle gallery, and vehicle state. They retain the existing snake_case document fields, collection names, string IDs, and REST-facing shapes to minimize API changes.

## Verified migration source

On 2026-11-12, the archived SQLite backup utility created a separate snapshot at `backend/.artifacts/mongodb-migration/source-riderent-20261112.sqlite`. The source was opened read-only. SQLite integrity and foreign-key checks passed, and all table hashes matched between source and backup.

Snapshot SHA-256: `98633a45f981ee15c598eda0ecf3a122cb25e1d1e66777b7e6b9867ba92edf4c`.

| Existing SQLite table / planned collection | Rows |
| ------------------------------------------ | ---: |
| `addon_allocations`                        |    1 |
| `addon_categories`                         |    2 |
| `addons`                                   |    1 |
| `audit`                                    |   41 |
| `booking_addons`                           |    0 |
| `booking_contacts`                         |   13 |
| `bookings`                                 |   13 |
| `checkout_items`                           |    1 |
| `checkout_orders`                          |    1 |
| `customers`                                |   12 |
| `inspections`                              |   12 |
| `maintenance`                              |    1 |
| `payments`                                 |   15 |
| `refunds`                                  |    2 |
| `rentals`                                  |    7 |
| `sessions`                                 |    1 |
| `settings`                                 |    1 |
| `users`                                    |    2 |
| `vehicles`                                 |   20 |

The migration mapping keeps the current normalized table names as MongoDB collection names. This avoids inventing new business semantics or merging historical records. Existing primary key values, foreign-key-like string references, booking references, timestamps, integer monetary values, password hashes, and booking snapshots remain unchanged. Compound-key tables receive a deterministic MongoDB `_id` while retaining their original key fields. Application-created writes preserve the same fields and generate MongoDB `_id` from the application ID.

The SQLite snapshot has 19 tables but the current Prisma schema maps 23 collections. `vehicle_images`, `contact_inquiries`, `booking_access_challenges`, and `customer_access_sessions` are absent from the SQLite source, and there are no source records to copy from them. The migration validator now calls these out explicitly; the MongoDB backend creates the required collections/indexes at startup. This gap should be reviewed before cutover, especially if those features were expected to have stored legacy data.

## Safety requirements

- Never write to the original `backend/data/riderent.sqlite` during migration.
- Use the verified snapshot as the source.
- Rehearse only into a new database such as `riderent_rehearsal`; never clear or replace the existing Atlas `riderent` database.
- Refuse migration when a target collection contains any record that is not byte-for-byte equivalent (after canonicalization) to the SQLite source record with the same `_id`. Exact already-imported records are accepted so an interrupted or repeated import can safely resume; missing source records are inserted, and no target record is replaced or deleted.
- Compare every source table count and deterministic record hash against MongoDB after import. Validate all application-level references and booking/payment totals.
- Preserve uploaded files separately; moving database rows does not move files in `backend/uploads`.
- Keep the MongoDB URI in local `backend/.env` and Render secrets only. Do not print it or commit it.
- Historical SQL/Prisma files and the original database are retained in place or in the archive; they are not installed as active backend dependencies.

## MongoDB transaction strategy to validate

Booking, checkout and add-on allocation now use `withTransaction()`. It updates a shared `system_locks` document in the same transaction to serialize critical stock checks, with MongoDB driver transaction retries for transient conflicts. Atlas transactions require a replica set (Atlas M0 supports transactions). This strategy is not production-verified until run against an isolated Atlas rehearsal database and concurrency tests pass.

## Live migration outcome — 2026-11-13

- The local backend loaded `MONGODB_URI` from the ignored `backend/.env` file. The business database name was explicitly set to `riderent`; `.env.example` and the code default now use the safer `riderent_rehearsal` value.
- The host's Windows DNS resolver resolved Atlas SRV records, but Node's default resolver pointed at an unavailable loopback DNS service. Added optional `MONGODB_DNS_SERVERS` support so the local runtime can use its configured resolvers; the local ignored `.env` has this value. Production should normally use the host's resolver and leave this option unset unless its DNS requires it.
- Read-only preflight found only one empty collection (`bookings`) in `riderent`; `riderent_rehearsal` was empty. No existing target documents needed backup/export.
- The initial snapshot had 146 rows. A final read-only comparison found six additional expired session records in the live SQLite database; the other 18 tables were identical. A fresh verified snapshot was created at `backend/.artifacts/mongodb-migration/source-riderent-20261113.sqlite` (SHA-256 `8ed712a09f3f3195ede3b3218397af6604f920d2c6a468962768360c59b44250`) with 19 tables / 152 rows. The original SQLite file passed integrity and foreign-key checks and was not written.
- Imported the fresh snapshot first to `riderent_rehearsal`, then reconciled `riderent` after the rehearsal passed. Both final reports show **19 collections / 152 records** with matching canonical hashes. A repeated import reconciled the same counts and hashes without adding duplicates or replacing records.
- MongoDB startup successfully initialized the application's indexes and shared transaction lock. The final production reconciliation report is `backend/.artifacts/mongodb-migration/riderent-reconciled-20261113.json`; the final rehearsal and repeat-import reports are beside it. These local artifact reports are not public and are ignored by Git.
- HTTP smoke checks against the MongoDB-backed server passed for health, readiness, session creation/cleanup, settings, vehicle list/detail, date-based checkout catalog and a server-calculated quote. The admin dashboard, booking, fleet, payment, customer, add-on, maintenance, audit and staff list routes returned the expected unauthenticated `401`. No booking or payment was created by the smoke check.
- MongoDB integration tests passed **2/2**, including concurrent last-inventory checkout, add-on reservation/cancellation release, OTP access-session flow, and one-unit overlap rejection. The test database naming bug (Atlas 38-byte database-name limit) was fixed by using a 24-hex-character random suffix.
- `npm run db:check`, `npm test` (4/4), `npm run format:check`, `npm run lint`, and `npm run build` passed. `npm run test:mongodb` passed 2/2. `npm run db` is not defined; `db:check` is the repository's database connectivity command.
- The original `backend/data/riderent.sqlite` and verified source snapshot were not modified. No deployment occurred.

### Remaining production verification

- The source SQLite schema has 19 tables while the archived Prisma schema maps 23 collections. `vehicle_images`, `contact_inquiries`, `booking_access_challenges`, and `customer_access_sessions` had no source table/records in the backup; the active Mongo backend creates the required collections/indexes at startup. Confirm that these feature datasets were never stored elsewhere if records are expected from another source.
- Automated MongoDB integration coverage currently contains two workflow tests. OTP tests use an injected test delivery function; real Resend delivery, complete authenticated admin workflows, payments/refunds, and browser end-to-end flows still require separate production-provider and UI verification.
- The final target is migrated and reconciled, but this is not a deployment. Keep the original SQLite database and both snapshots for rollback; create a new verified snapshot if SQLite receives additional records before any future migration.

## Verification update — 2026-11-12

- `npm run lint`: passed.
- `npm run build`: passed.
- `npm --prefix backend run test:unit`: 3/3 passed. These cover Mongo transaction helper sequencing and repository session propagation; they do not exercise a live server.
- `node archive/legacy-prisma-sqlite/scripts/migrate-sqlite-to-mongodb.mjs --sqlite backend/.artifacts/mongodb-migration/source-riderent-20261112.sqlite --validate-only`: passed; 19 tables / 146 records, with the four absent collections listed above.
- `npm --prefix backend run test:mongodb`: blocked before connecting because `MONGODB_URI` is absent from `backend/.env`.
- The archived legacy SQLite suite was run before archival: 9 passed / 47 failed because fixtures supplied SQLite/Prisma adapters to MongoDB-backed services. Those failures are not MongoDB integration coverage; equivalent workflows need MongoDB-backed tests.
- Neither `mongod` nor Docker is installed locally, so an isolated transaction-capable MongoDB test server is not available without Atlas credentials.

## Backend code-conversion update — 2026-11-13

- Removed Prisma, Prisma's SQLite adapter and `better-sqlite3` from backend dependencies and the backend lockfile. Active backend environment validation no longer accepts `DATABASE_URL` or `DB_PATH`.
- Moved the prior Prisma schema/config, all SQL migrations, seed/setup helpers and SQLite-bound tests into `archive/legacy-prisma-sqlite/`. The original `backend/data/riderent.sqlite` and verified snapshot were not moved or written.
- Removed Prisma generation, SQLite setup/baseline/backup/restore and old browser-test commands from active application scripts. The standalone one-time importer remains archived and is not run at startup.
- Static search across `backend/src`, active scripts, active tests, package manifests/lock and `.env.example` found no Prisma, SQLite or raw SQL dependencies.
- `npm test`: 4/4 database-independent Mongo helper/repository tests passed. `npm run lint`, `npm run format:check` and `npm run build` passed.
- The archived importer ran `--validate-only` successfully against the verified source (19 collections/tables, 146 records). It did not connect to Atlas or write data.
- The missing local Atlas URI is not a blocker to this code-only conversion, but live MongoDB route, transaction, concurrency and imported-data behavior remain unverified by design. No data import or deployment occurred.

## Operating commands

- `npm run db:check` verifies a MongoDB ping without changing business records.
- `npm test`, `npm run lint`, `npm run format:check`, and `npm run build` run local code checks.
- `npm run test:mongodb` uses a generated `riderent_test_*` database and drops only that generated test database after tests finish. Do not point this test command at a production-only credential if the account cannot create/drop isolated test databases.
- The one-time importer remains archived at `archive/legacy-prisma-sqlite/scripts/migrate-sqlite-to-mongodb.mjs`. It requires explicit `--confirm-riderent-target` for the business DB, reads only the verified snapshot, checks all target documents before inserts, refuses conflicts, and verifies canonical hashes afterward.
- Keep `MONGODB_URI` only in ignored `backend/.env` locally and the deployment provider's secret settings. Never commit or print it.
