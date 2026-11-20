# RideRent Pre-production Remediation — Batch 0 and Batch 1

**Run date:** 2026-11-11  
**Database engine:** Prisma + SQLite  
**Scope:** Protect the current checkout, back up the business database, inspect schema drift, and rehearse migration reconciliation on an isolated copy. The original business database was not migrated or written to.

## Executive result

- Batch 0 is complete. The checkout was clean at `3991923370c337861f75e69cf935d8a3d6c6bbfd`; this differs from the pasted audit prompt's statement that there were 188 working-tree entries. The live checkout was treated as authoritative.
- A source archive and a consistent SQLite backup were created and integrity-checked.
- The 19-table business database is missing two tables and migration history. Existing table columns and foreign keys match the checked-in SQL migrations, but eight expected indexes and 24 identifier guard triggers are absent.
- Reconciliation was rehearsed on a separate database copy. All 15 business-table row sets retained identical counts and hashes; SQLite integrity and foreign-key checks passed.
- Customer vehicle-listing and checkout-catalog read APIs returned HTTP 200 on the rehearsed database (20 vehicles/models and one add-on).
- **Do not run Prisma's generated schema diff or `db push` against the business database.** The current Prisma data model differs from the hand-authored migration schema and Prisma proposes rebuilding 17 populated tables.
- The business database has not been changed. Production migration remains gated on explicit operator approval and resolution of the Prisma-model drift.

## Batch 0 — Source protection

The actual Git state was branch `main`, commit `3991923370c337861f75e69cf935d8a3d6c6bbfd`, clean status, zero tracked modifications, and zero untracked files. The prompt's reported 188 status entries were not present in this checkout.

Created the ignored local source archive:

`backend/.artifacts/preprod-remediation/worktree-snapshot-2026-11-11.zip`

It contains the 527 tracked files plus an audit manifest (528 ZIP entries total). It excludes `.git`, dependency/build output, generated artifacts, database/upload data, and secret `.env` files. The archive passed ZIP integrity verification.

- Size: 22,930,422 bytes
- SHA-256: `E5EA040A16A1D51DA160AB97FB67102881C8175E9DA3CA160499A1EC14235D10`

The source archive and database artifacts live under the ignored `backend/.artifacts/` directory and are local recovery materials, not source changes.

## Batch 1 — Consistent database backup

Created the backup using SQLite's Online Backup API from a read-only connection, which captures a consistent database image even when WAL mode is in use. See [SQLite Online Backup API](https://www.sqlite.org/backup.html).

Backup:

`backend/.artifacts/preprod-remediation/riderent-consistent-2026-11-11.sqlite`

- SHA-256: `51835775c8aedbf3f453085a4ccdb9dacf844aad9597141e2784abcb6da29312`
- `PRAGMA integrity_check`: `ok`
- `PRAGMA foreign_key_check`: zero violations
- Application tables: 19
- `_prisma_migrations`: absent
- Business counts: 20 vehicles, 13 bookings, 12 customers, 15 payments, 7 rentals, 1 add-on, 1 checkout order and 1 checkout item (plus related records).

The current original database and the verified backup were separately opened read-only and compared across 15 business tables. Row counts and row fingerprints matched. No original business rows were changed by this work.

Additional inspection outputs:

- `backend/.artifacts/preprod-remediation/riderent-schema-before.json`
- `backend/.artifacts/preprod-remediation/schema-drift.json`

## Confirmed schema drift

The checked-in migrations describe 21 application tables. The business database contains 19. Missing tables are:

- `vehicle_images` (migration `0004_vehicle_gallery`)
- `contact_inquiries` (migration `0005_contact_inquiries`)

For tables present in both the database and migration chain, columns, foreign keys, and normalized table definitions/check constraints match. The database is missing these eight migration-defined indexes:

- `session_expiration`
- `booking_status_window`
- `booking_created_at`
- `payment_booking_created`
- `refund_payment`
- `inspection_rental_created`
- `maintenance_status_window`
- `audit_created_at`

It is also missing 24 identifier guard triggers (insert and update guards for 12 identifier-bearing tables). Migration history `_prisma_migrations` is absent. The checkout-order and add-on tables already exist and their table definitions match migrations `0006_checkout_orders` and `0007_dynamic_addons`.

## Isolated migration rehearsal

The strategy was rehearsed only on:

`backend/.artifacts/preprod-remediation/riderent-migration-rehearsal.sqlite`

The rehearsal marked the verified baseline and already-present exact `0006`/`0007` schemas as applied, then ran `prisma migrate deploy` to apply the missing additive migrations `0002`–`0005`. It did not run on the original database.

Evidence in `backend/.artifacts/preprod-remediation/rehearsal-verification.json`:

- All seven migration names recorded; Prisma reports schema up to date.
- 21 application tables, 24 identifier guard triggers and 18 explicit indexes.
- All 15 protected business tables retained identical row counts and SHA-256 hashes before and after.
- SQLite integrity check `ok`; foreign-key violations `0`.
- `prisma validate` passed.
- Read-only API smoke: `GET /api/vehicles` returned 200 with 20 records; `GET /api/checkout/catalog` returned 200 with 20 models and 1 add-on.

The API smoke test was against the isolated rehearsal database only. No booking was created.

### Batch 3/4 fresh-copy rehearsal addendum — 2026-11-11

The currently configured `backend/data/riderent.sqlite` was checked read-only (`integrity_check: ok`) and copied with the SQLite Online Backup API to the ignored local artifact `backend/.artifacts/preprod-remediation/riderent-predeploy-2026-11-11.sqlite` (SHA-256 `a9aed7d1a921e43fdd4db9ca19e5a457213bed0a5781033f297070093e3749c6`). A second verified copy was used for migration rehearsal; the configured business database was not used as a migration target.

On that disposable copy only, the previously verified baseline procedure was repeated: mark the exact existing baseline and matching `0006`/`0007` schemas as applied, then run `prisma migrate deploy`. Migrations `0002`–`0005` and `0008_customer_access_security` applied successfully. All 19 pre-existing application table row hashes remained unchanged. The copy gained `vehicle_images`, `contact_inquiries`, `booking_access_challenges` and `customer_access_sessions`; SQLite integrity is `ok`, foreign-key violations are zero, and the migration history lists `0001`–`0008`.

This validates the migration sequence against a fresh copy of the local SQLite file, but it does not authorize or perform a production migration. Keep the copy and backup private: they contain customer and business data. The production target and migration window still need operator confirmation, and the business database must be backed up again immediately before any approved production operation.

## Prisma model alignment blocker

A read-only `prisma migrate diff --from-config-datasource --to-schema ...` against the rehearsal copy proposed rebuilding 17 populated tables, including bookings, payments, customers, vehicles and checkout tables. It also proposes index/constraint differences from manually authored SQLite SQL. One observed mismatch is that Prisma declares a `BookingAddon` relation while migration `0006_checkout_orders` creates `booking_addons` without a foreign key to `bookings`.

This broad diff was **not applied**. Do not use it as a production migration and do not run `prisma db push`. Before future migrations, reconcile Prisma's data model and the existing SQL schema with a reviewed, narrowly scoped plan that preserves custom checks and existing records.

## Proposed production sequence — approval required

No step below has been run on the business database. Before any production change, the operator must explicitly approve the migration window and confirm the target database path.

1. Stop the backend and all database writers; confirm no active SQLite connection is using the target.
2. Create a fresh consistent backup immediately before the change using SQLite's backup API. Verify its SHA-256, integrity and foreign keys, and store a second copy outside the application directory.
3. Re-check the target's table/column/constraint signatures against this report. Stop if it differs.
4. On the target only after approval, record the already-existing baseline and matching `0006`/`0007` migrations as applied, then deploy the remaining checked-in migrations. Do not run `db push` or the generated 17-table diff.
5. Verify every original business table's count and deterministic row hash against the pre-migration backup; verify `integrity_check`, `foreign_key_check`, migration status, and read-only vehicle/catalog API smoke tests.
6. Resume service only if all checks pass. If any check fails, keep writes stopped and follow restore steps below.

The exact commands should be run from the deployed release using that release's Prisma version and an explicitly supplied target URL; never rely on an implicit local default path.

## Rollback and restore procedure

SQLite schema migrations are not reliably reversible by simply deleting `_prisma_migrations` rows. If a production migration fails or validation differs from the backup:

1. Stop the backend and keep all writers disabled. Do not attempt another migration or manually delete migration-history rows.
2. Preserve the failed database and any `-wal`/`-shm` sidecars in a separate timestamped incident folder for diagnosis. Never overwrite this evidence.
3. Restore the pre-migration verified snapshot to a new staging filename with SQLite's backup API. Verify integrity, foreign keys and expected business row hashes there.
4. Once verified, replace the active SQLite file only while the application is stopped, or switch the configured database path to the restored file. Do not copy only the main `.sqlite` file while a live WAL connection may exist.
5. Start the backend against the restored file, run read-only health and vehicle/catalog checks, and confirm the expected migration state before reopening writes.
6. Keep the failed database and original backup until the incident is reviewed and a new backup is verified.

## Files changed and remaining work

The only tracked file added for this batch is this report: `docs/preproduction-remediation-batch-0-1.md`. No application code, Prisma schema, migration, environment file, or business database was modified.

Before proceeding to deployment preparation or applying migrations to the business database:

- Review and approve the production migration window and target path.
- Resolve the Prisma schema vs SQL migration mismatch without applying the 17-table rebuild.
- Confirm that the local verified backup is copied to a separately protected location.

Batch 2 and later phases have not been started.
