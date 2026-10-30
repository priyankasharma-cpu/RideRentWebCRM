# Architecture

The repository root coordinates two independent npm packages, each with its own lockfile and node_modules. Customer and administrator React code lives in frontend; server code, Prisma, uploads and backend tests live in backend. Root package scripts and lint/format configuration are shared tooling, not application code.

Frontend entry points are src/main.jsx, App.jsx and routes.jsx. Customer pages and protected admin routes are lazy-loaded. AppProviders supplies theme, authentication, shop configuration, notifications and React Query. Component styles use ordered cascade layers to preserve the original design.

The backend starts at src/server.js and assembles Express in src/app.js. Modules separate routes, input validation, controllers, services and repositories. Controllers return HTTP responses; services enforce workflows; repositories contain parameterized database access. Prisma supports the existing SQLite relational schema without converting historical records.

Booking reads use batched relation loading and presenters. The dashboard query count on the baseline snapshot fell from 117 to 15; DTOs were compared against the original reader for all 11 bookings and 20 vehicles. SQLite transactions acquire a write lock before checking availability. A per-file queue avoids synchronous adapter deadlocks between connections in this process; database locking protects competing processes.

See architecture-assessment.md for the original audit. Legacy sources, snapshots and temporary transformation scripts were moved into a verified external backup. Current disposable test data and screenshots live in backend/.artifacts.
