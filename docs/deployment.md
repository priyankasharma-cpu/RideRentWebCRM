# RideRent Deployment: Vercel, Render, and MongoDB Atlas

RideRent is deployed as a Vite frontend on Vercel, an Express API on Render, and MongoDB Atlas for the database. Deployment does not migrate, seed, reset, or reimport database records.

## Vercel frontend

Use the repository root as **Root Directory** (`./`). The supported settings are committed in the root `vercel.json`:

- Install: `npm --prefix frontend ci`
- Build: `npm --prefix frontend run build`
- Output: `frontend/dist`
- API: `/api/*` rewrites to the Render API origin.
- Uploads: `/images/uploads/*` rewrites to the Render API origin.
- Other paths: SPA fallback to `/index.html`, so React Router routes work on direct refresh.

The frontend uses relative `/api/...` requests with same-origin cookies and CSRF tokens. Vercel rewrites preserve the browser-facing origin and forward API requests to Render. The root `vercel.json` contains the public Render service origin; no `RIDERENT_BACKEND_ORIGIN` Vercel environment variable is required. Remove that old variable from Vercel settings if it was added for the obsolete `vercel.mjs` configuration.

## Render backend

`render.yaml` now describes the backend-only service:

- Root Directory: `backend`
- Build: `npm ci --omit=dev`
- Start: `npm run start`
- Health check: `/readyz`
- `PORT` is supplied by Render; the app binds to `0.0.0.0`.
- Automatic deploys are disabled in the Blueprint.

Set these environment variables in the Render service. Never put secrets in Git:

| Variable           | Value                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| `NODE_ENV`         | `production`                                                                |
| `HOST`             | `0.0.0.0`                                                                   |
| `MONGODB_URI`      | MongoDB Atlas connection URI, entered as a secret                           |
| `MONGODB_DB_NAME`  | `riderent`                                                                  |
| `APP_ORIGIN`       | Exact production Vercel origin, e.g. `https://riderent-frontend.vercel.app` |
| `TRUST_PROXY_HOPS` | `1`                                                                         |
| `UPLOAD_DIR`       | `/tmp/riderent-uploads` for the current free demo setup                     |
| `RESEND_API_KEY`   | Resend secret, required for production email OTP                            |
| `OTP_FROM_EMAIL`   | Verified Resend sender, required for production email OTP                   |
| `OTP_HASH_SECRET`  | Random secret of at least 32 characters, required for production email OTP  |

`APP_ORIGIN` must be the exact browser origin, not the Render API URL. Enter it without a trailing slash, path, query, or fragment. For example, use `https://riderent-frontend.vercel.app`, not `https://riderent-frontend.vercel.app/`. If customers also use a custom domain, include each exact HTTPS origin separated by commas. The validation is intentionally strict for CORS and CSRF protection.

Render's free filesystem is ephemeral. Files uploaded under `/tmp/riderent-uploads` can disappear after a restart or deploy. Vehicle records and MongoDB data remain in Atlas, but uploaded image files need durable object storage or a persistent disk before production use.

## Manual deployment order

1. Review and commit the deployment configuration changes.
2. Push the branch to GitHub. Check Vercel's Git settings first because Vercel may automatically build on a push; Render's Blueprint is configured with automatic deploy disabled.
3. In Vercel, import the repository with Root Directory `./`. Let the committed `vercel.json` set build, output, and rewrites; remove stale manually entered rewrite settings if Vercel still shows the old validation error.
4. Deploy the frontend and copy its actual production domain from Vercel. No Vercel environment variable is needed for the static rewrites.
5. In Render, set `APP_ORIGIN` to that exact Vercel origin and set the remaining variables above. Confirm the service Root Directory is `backend` and the commands match `render.yaml`.
6. Trigger the Render deploy manually. Confirm `/readyz` returns `{"status":"ready"}` and the Render logs contain `server_ready`.
7. Test the Vercel website, direct refresh on `/vehicles`, `/checkout`, and `/admin`, plus read-only API loading. Do not test by creating real bookings or changing production records.

## Git commands

Review the exact changes before committing; do not stage `.env` files or build output:

```powershell
git status --short
git diff -- vercel.json vercel.mjs render.yaml frontend/.env.example docs/deployment.md
git add vercel.json render.yaml frontend/.env.example docs/deployment.md
git rm vercel.mjs
git commit -m "Fix Vercel and Render deployment configuration"
git push origin main
```

Pushing can start a Vercel deployment if its Git auto-deploy setting is enabled. Review or disable that setting first if you want to control the deployment timing.
