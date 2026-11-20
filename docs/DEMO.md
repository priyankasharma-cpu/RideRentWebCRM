# RideRent development and demo notes

The active backend requires MongoDB. Configure `MONGODB_URI` privately in `backend/.env`; no database is seeded automatically. The previous demo seed was SQLite-specific and is preserved only in `archive/legacy-prisma-sqlite/` for historical reference. Do not expect demo vehicles or bookings in an empty MongoDB database.

Run `npm install`, then `npm run dev` with Node 24.14 or newer. The API exits with a clear configuration error if MongoDB is not configured. After MongoDB data is available, the site supports the existing customer booking and admin workflows through the API.

## Verification

- `npm test`: local backend unit tests that do not require a database.
- `npm run build`: production frontend bundle.
- `npm run lint`: frontend and active backend lint.
- `npm run db:check`: read-only MongoDB connection ping; requires `MONGODB_URI`.
- `npm run db:migrate:mongodb` is intentionally not an active command. The archived importer is a separately reviewed data-migration tool.

## Before production

Populate the MongoDB database with reviewed business data, create/verify the initial admin account, update placeholder contact information and policies, and configure durable upload storage. Configure `RESEND_API_KEY`, `OTP_FROM_EMAIL` and a unique `OTP_HASH_SECRET` of at least 32 characters before enabling production customer booking access. Payment gateways, SMS/WhatsApp and multi-branch operations are not integrated.
