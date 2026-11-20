# RideRent backend

Runtime code is in `src/`, MongoDB connection and indexes are in `src/config/mongoDatabase.js`, utility scripts are in `scripts/`, and active unit/MongoDB integration tests are in `tests/`. Start the full local app with `npm run dev` from the repository root after configuring `backend/.env` with a MongoDB URI.

The previous Prisma schema, SQLite migrations, setup tools and SQL test harness are preserved under `../archive/legacy-prisma-sqlite/`. They are historical only and are not used by the active runtime. The SQLite-to-MongoDB importer is also archived and must be used only as a separately reviewed data migration; it is not exposed as an application setup or migration command.

See `../docs/backend-guide.md`, `../docs/sqlite-to-mongodb-migration.md` and `../docs/deployment.md`.
