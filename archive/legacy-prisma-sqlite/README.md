# Archived Prisma and SQLite artifacts

This directory preserves the previous SQLite/Prisma schema, SQL migrations, seed, SQL helpers and tests as historical artifacts. Nothing in this directory is imported by `backend/src`, installed as an active backend dependency, or run by root application scripts.

The original database at `backend/data/riderent.sqlite` and the verified snapshot under `backend/.artifacts/mongodb-migration/` are separate files and remain untouched. The preserved `scripts/migrate-sqlite-to-mongodb.mjs` is a standalone one-time data-import utility, not an application startup migration. It was not run against Atlas as part of the code conversion.

The archived SQL tests are not compatible with the MongoDB repositories and are retained for historical reference only. Active tests are in `backend/tests/unit/` and `backend/tests/mongodb/`.
