# Architecture

The repository root coordinates independent frontend and backend npm packages. Customer and administrator React code lives in `frontend/`; Express APIs, business modules, upload handling, database configuration and backend tests live in `backend/`. Root scripts and lint/format configuration are shared tooling.

Frontend entry points are `frontend/src/main.jsx`, `App.jsx` and `routes.jsx`. Customer pages and protected admin routes are lazy-loaded. App providers supply theme, authentication, shop configuration, notifications and React Query. Component styles use ordered cascade layers.

The active backend starts at `backend/src/server.js` and assembles Express in `backend/src/app.js`. Modules separate routes, validation, controllers, services and repositories. Controllers produce HTTP responses, services enforce workflows, and repositories use the official MongoDB Node.js driver through `backend/src/config/mongoDatabase.js`.

The active runtime uses the official MongoDB driver, collection names matching the previous relational tables, stable identifiers and snake_case fields. Booking/checkout writes use MongoDB transactions and a shared write-queue document to serialize critical availability checks. This transaction strategy still requires isolated Atlas rehearsal and concurrency testing before production approval.

Prisma, SQLite setup, and the old SQL test harness are archived under `archive/legacy-prisma-sqlite/`; they are not active runtime code or dependencies. The one-time SQLite import utility is also archived there and is run directly only as a separately reviewed data-migration step. The original SQLite file and verified snapshot remain in place and must not be overwritten.

See `sqlite-to-mongodb-migration.md` for source counts, migration safety, rehearsal steps and current readiness blockers. Earlier architecture assessments and phase reports describe the historical SQLite implementation and should be read as dated records, not current runtime documentation.
