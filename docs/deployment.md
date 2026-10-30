# Deployment

Requires Node.js 24.14+ and npm. Install dependencies with npm ci, run npm run db:generate, npm run build, then npm start. Express serves frontend/dist and the API on port 3001 by default.

Configure backend/.env from backend/.env.example. Set NODE_ENV=production, APP_ORIGIN to the public HTTPS origin, HOST/PORT for your reverse proxy and DB_PATH or DATABASE_URL for persistent SQLite storage. DATABASE_URL takes precedence and must be a plain file URL. Keep .env, database files and uploaded customer assets out of source control. Secure cookies require HTTPS. Persist backend/uploads and the database with restricted filesystem access and tested backups.

## Fresh local installation

npm run setup creates .env only when missing, generates Prisma, and initializes fictional demo records only when the configured database does not exist. It preserves an existing database. Demo seed data is unsuitable for a real client launch; provision reviewed production records and credentials before going live.

## Existing database migration

Stop application writes and make a consistent SQLite backup. Validate on a copied database first:

    npm run db:baseline -- --database backend/.artifacts/copied-database.sqlite

The baseline command checks foreign keys, identifiers and business-row hashes, marks the known baseline applied and deploys additive migrations. It refuses unknown schemas. After reviewing the copy, repeat with the explicitly intended persistent database path during a maintenance window. No reset command is needed. Existing production data has not been migrated as part of this refactor.

For an already tracked database, review pending migrations and run npm run db:migrate with the intended environment. Restore a tested backup and matching application version if rollback is required; do not assume destructive schema rollback is automatic.

SQLite supports a single writer. Use a single host and local persistent disk. Multi-host scaling requires a separately designed relational database migration and concurrency review. External payment gateways, SMS/email delivery and production infrastructure are separate integrations; the current workflow records payments collected at the shop.
