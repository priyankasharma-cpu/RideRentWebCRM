# RideRent Deployment Guide — Vercel, Render, MongoDB Atlas

## Current deployment architecture

- **Frontend:** React + Vite static build on Vercel.
- **API:** Express on Render.
- **Database:** MongoDB Atlas through the official `mongodb` Node.js driver.
- **Uploads:** stored under `UPLOAD_DIR`; this remains separate from Atlas and needs durable storage if uploaded files must survive service restarts or redeploys.

The active API starts in `backend/src/server.js`, connects to Atlas before listening, and exits if the database is unavailable. `/healthz` checks process health; `/readyz` checks MongoDB and upload-directory access. Deployment and copying records are operator-controlled; no service was deployed by this change.

## Before creating or deploying a service

1. Keep the original SQLite database and the verified snapshot unchanged for rollback.
2. Set `MONGODB_URI` only in local `backend/.env` and service secrets. Do not commit or paste it into chat.
3. First use a new rehearsal database such as `riderent_rehearsal`; do not point a running backend at the empty production database until the rehearsal report is reviewed.
4. In Atlas Network Access, allow your current public IP for local testing. After the Render service exists, add the service's outbound IP ranges from Render **Connect → Outbound**. Avoid `0.0.0.0/0`.
5. The Atlas project must use a database user with only the permissions needed by RideRent. Atlas credentials are different from the Atlas website login.
6. Do not sync the Render Blueprint or trigger a deploy until database rehearsal/reconciliation and upload storage are approved.

## Vercel frontend

Create the Vercel project from the repository root. `vercel.mjs` configures:

- Install command: `npm --prefix frontend ci`
- Build command: `npm --prefix frontend run build`
- Output directory: `frontend/dist`
- API and uploaded-image rewrites to the Render service

Set `RIDERENT_BACKEND_ORIGIN` in Vercel to the Render service's exact HTTPS origin, for example `https://<service-name>.onrender.com`, without a path or trailing route. Set it for each environment that should call the API, then redeploy the frontend. The value is checked during the Vercel build and is not embedded in client-side JavaScript.

## Render backend

`render.yaml` defines a **free** Node web service, readiness path, Singapore region, and autodeploy disabled. Its build installs backend/frontend dependencies and builds the frontend; its start command is `npm start`. It does not migrate, seed, or copy business data.

Set these environment variables in Render:

| Key                | Value                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`         | `production`                                                                                                     |
| `HOST`             | `0.0.0.0`                                                                                                        |
| `MONGODB_URI`      | Atlas connection string stored as a secret                                                                       |
| `MONGODB_DB_NAME`  | The reviewed Atlas database name; use `riderent_rehearsal` for rehearsal, not `riderent` before cutover approval |
| `APP_ORIGIN`       | Exact HTTPS Vercel website origin(s), comma separated, no trailing slash                                         |
| `UPLOAD_DIR`       | Absolute writable path for uploaded files                                                                        |
| `TRUST_PROXY_HOPS` | `1` for the current Render proxy setup                                                                           |
| `RESEND_API_KEY`   | Required only if production email OTP delivery is enabled                                                        |
| `OTP_FROM_EMAIL`   | Verified sender address for email OTP                                                                            |
| `OTP_HASH_SECRET`  | Random secret of at least 32 characters                                                                          |

Render supplies `PORT`. The backend requires explicit `MONGODB_DB_NAME` in production and refuses SQLite configuration as a database fallback.

### Free-plan upload limitation

The Blueprint uses `/tmp/riderent-uploads` and does not attach a paid persistent disk. Atlas stores records and image URLs, not the actual uploaded files. Render Free uses an ephemeral filesystem: admin-uploaded files may disappear after a restart or redeploy. Treat this configuration as a free rehearsal/demo setup only. Before production, connect uploads to durable object storage or choose a paid Render service with a persistent disk. No paid service has been created here.

## SQLite rehearsal and data transfer

The original SQLite database is not used by the active API. It remains the source for migration and rollback only. A verified snapshot is at:

`backend/.artifacts/mongodb-migration/source-riderent-20261112.sqlite`

The snapshot had 19 tables and 146 rows; source integrity, foreign keys and snapshot hashes passed. Four newer collections (`vehicle_images`, `contact_inquiries`, `booking_access_challenges`, `customer_access_sessions`) were absent from that SQLite source, so there are no corresponding old rows to import.

After setting `MONGODB_URI` locally and allowing the developer IP, perform the rehearsal using the exact command documented in `docs/sqlite-to-mongodb-migration.md`. Review its count/hash report and run isolated MongoDB tests before copying to `riderent`. The migration utility refuses a conflicting target, writes no records over existing records, and requires an explicit flag for the `riderent` business database. It never modifies the SQLite source.

No records have been copied to Atlas yet. The existing Atlas `riderent` database was observed with an empty `bookings` collection; do not infer that it is ready for cutover until all collection counts and application workflows are reconciled.

## Backups and rollback

- Keep the original SQLite file and verified backup offline and unchanged until Mongo cutover is accepted.
- Before Mongo cutover, export the Atlas rehearsal/production database using an approved MongoDB backup process and verify the archive can be restored into a separate database.
- For example, with the MongoDB Database Tools installed and `MONGODB_URI` already set in the shell (do not put credentials in shell history): `mongodump --uri="$MONGODB_URI" --db="$MONGODB_DB_NAME" --archive=./riderent-backup.archive --gzip`.
- Restore only to a new, separate rehearsal database first. Never drop the existing `riderent` database as a rollback shortcut.
- Rollback means stop writes, direct the application back to the verified prior backend/database under an approved maintenance plan, and reconcile bookings created after cutover. Do not copy the old SQLite file over a live database.

## Local development

Add the real Atlas URI privately to `backend/.env`, with `MONGODB_DB_NAME=riderent_rehearsal` for rehearsal. Do not commit `.env`. Run the frontend/API using `npm run dev` from the repository root. To start only the API, run `npm start` from the root; it requires the MongoDB environment to be configured.

## Current migration readiness

- Native MongoDB backend modules and free Render configuration are prepared locally.
- Frontend lint, build and the local transaction-helper unit tests pass.
- The verified SQLite snapshot validates at 19 tables / 146 rows.
- Atlas import, reconciliation, MongoDB transaction/concurrency tests and customer/admin end-to-end workflows are **not verified** because `backend/.env` does not currently contain `MONGODB_URI`.
- The Atlas business database has not been changed, and no service has been deployed.
- Durable persistence for admin-uploaded images is not configured and is a production blocker for the free Render plan.
- Keep Prisma/SQLite dependencies and historical migrations until Atlas rehearsal, data reconciliation, workflow verification and rollback review are complete.
