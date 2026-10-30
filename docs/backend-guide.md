# Backend guide

Runtime entry: backend/src/server.js. Express assembly: backend/src/app.js. Configuration: backend/src/config. Each business module owns routes, controllers, services, repositories and validation where needed. Shared middleware handles session authentication, role authorization, CSRF, rate limiting and errors.

Use the shared booking service for website, phone and walk-in reservations. Keep database operations in repositories and transact availability checks with reservation creation. Use integer minor units for money. Prisma BigInt values are normalized to safe JSON integers; out-of-range values fail explicitly.

Run npm test for isolated integration tests. npm run test:ui and npm run test:layout create disposable databases and never target the running agency database. npm run db:generate regenerates the Prisma client. Review deployment.md before applying any migration to existing data.

Uploads are stored in backend/uploads and served through a validated image route. Sessions use hashed tokens and HTTP-only cookies. Production requires HTTPS for secure cookies and a correctly configured APP_ORIGIN.
