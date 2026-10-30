# Folder cleanup — 30 October 2026

## Inspection and decisions

The previous root node_modules existed because npm workspaces hoisted both applications into one shared installation. It was functional, but did not meet the requested dependency separation. Both applications now have independent package.json, package-lock.json and node_modules. Root package scripts coordinate them with npm --prefix. Root has no runtime or development dependencies.

Root data contained the real SQLite database and its WAL/SHM sidecars. They were relocated together, after stopping only RideRent server processes, to backend/data. Database configuration now points at the moved file. No seed, reset, schema migration or business-record update was performed. A read-only snapshot of every business table before and after the move verified unchanged row counts and SHA-256 hashes for all 13 tables. Private configuration was compared as parsed key/value pairs: only DB_PATH changed.

Root output held temporary transformation scripts, old source copies, screenshots, copied databases, lint reports and query measurements. Its 91 files were copied to an external backup and every file hash was verified. The root folder was then archived outside the active project. New browser screenshots and disposable test databases are generated under backend/.artifacts and ignored by Git.

The docs directory remains at root because architecture, deployment, booking and editing documentation applies to both applications. Root README, package scripts/minimal lockfile, .gitignore and shared lint/format configuration also remain project-wide. .env and its example belong to backend; frontend retains its own nonsecret .env.example.

## Moved or replaced

- data/riderent.sqlite and associated WAL/SHM → backend/data/.
- Root .env → backend/.env. Existing credentials and settings preserved; DB_PATH updated to backend/data/riderent.sqlite. Relative database paths continue to resolve from the project root.
- Frontend runtime/build dependencies → frontend/node_modules with frontend/package-lock.json.
- Backend runtime, Prisma and shared verification tools → backend/node_modules with backend/package-lock.json.
- Original workspace package-lock.json → external archive; replaced by a minimal root orchestration lockfile.
- Root output, including superseded source files, old builds and temporary scripts → external archive.
- Root duplicate .env.example → external archive; backend/.env.example is the maintained server example.

External archive for this cleanup: E:/piyasharmawebwork/MyDemoprojects/RideRentwebCRM-backups/cleanup-20261030-180045 . It includes a consistent stopped-server file backup, private settings and old source. Keep it private. It is outside the project and is not imported or served by either application.

## Verified removals

Removed five unused direct transformation dependencies from the active package manifests: @babel/generator, @babel/parser, @babel/traverse, postcss and postcss-selector-parser. Build tools may retain their own transitive dependencies. Removed an unused photos export/import from homeContent.js. Removed empty obsolete output and frontend/public/images/uploads directories after checking contents. Marketing image aliases were deliberately retained because existing database records reference those URLs.

Automatic safety review rejected bulk deletion of the old dependency/output directories without providing a detailed reason. Those directories were moved into the external archive instead of permanently deleted. No permanent deletion of the source/database backups was attempted.

## Paths and scripts updated

Updated environment loading, setup defaults, database fallback, disposable database paths, browser screenshot paths, Vite/Prisma executable paths, root command orchestration, lint package resolution, ignore rules and documentation. No root dependency resolution fallback is needed. Uploaded images remain in backend/uploads and are served through the existing protected validation pipeline.

## Verification

Formatting and ESLint pass. All 22 backend integration tests pass, including overlapping booking protection, concurrent Prisma connections, historical prices, authorization, CSRF, upload checks and the full rental lifecycle. Frontend production build passes. Browser workflow covers customer search/booking/confirmation, admin login, online/manual bookings, license checks, payments, actual pickup/return, inspection/refund and all 13 admin views. Responsive browser checks pass at 390, 768, 1024 and 1440 pixels. Theme persistence, mobile navigation and runtime/server error checks pass.

Prisma client generation and setup pass using backend-local dependencies; setup reports that the existing database is preserved. npm ls reports no missing direct dependencies for either application. Both independent installs reported zero known audit vulnerabilities.

Run npm run verify to reproduce checks. Run npm ci then npm run setup for installation, and npm run dev for development. Client records must never be reset as a setup shortcut.

## Development preview verification

Live Vite testing exposed an import initialization error in admin/routes.jsx that the production bundler did not expose. Imports now precede lazy route declarations. The running development preview was checked for customer rendering, loaded vehicle images and administrator login with the preserved credentials. No page errors remained after the fix. The preview uses a disposable copied database, not backend/data/riderent.sqlite.
