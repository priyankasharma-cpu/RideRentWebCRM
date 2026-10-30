# Architecture assessment — before refactoring

## Inventory

The initial repository has a root Vite application (`src/main.jsx`, `src/App.jsx`) and Express entry points (`backend/server.js`, `backend/app.js`). Customer routes are declared in `App.jsx`; admin routes live inside a single `src/admin/Admin.jsx`. Public/admin API paths are all registered inside `backend/app.js`. The API contract will be preserved.

SQLite contains 13 relational tables: users, sessions, vehicles, customers, bookings, booking_contacts, rentals, inspections, payments, refunds, maintenance, settings and audit. Existing foreign keys, status checks, historical amounts and availability indexes must remain intact. The database currently uses `node:sqlite`, not Prisma. UTC timestamps are stored as ISO text and money as integer paise. These representations must not silently change during ORM adoption.

Existing tests cover 19 backend integration scenarios plus browser workflows and responsive screenshots. The integration suite uses an isolated database. The existing browser workflow creates bookings in whichever server it targets; it must be changed to launch its own disposable database rather than target working records.

## Findings

- `Admin.jsx` contains the entire admin shell, 13 screens, charts, forms, booking workflows and data fetching in densely packed source. `CustomerPages.jsx` combines unrelated pages. `Home.jsx` contains every homepage section and its state.
- `components.jsx` mixes navigation, customer cards, dialogs, animation and form controls. `lib.jsx` combines session transport, authentication, theme, presentation and formatting.
- `backend/app.js` mixes route registration, validation, SQL, business transitions, authorization, uploads, server configuration and error responses. `domain.js` mixes booking, pricing, vehicle presentation and analytics. Controllers do not yet exist.
- CSS is spread across three large global files. Component rules, responsive overrides and theme-specific overrides rely on source order. Generic `header`, `nav`, `input` and `label` rules can affect admin pages. Moving rules without preserving cascade order would create visual regressions.
- The polling hook duplicates fetching/error/loading management and lacks shared caching, invalidation or request cancellation. Quote fetching is repeated on vehicle details, checkout and manual booking screens.
- Image paths and marketing content are distributed through JSX/CSS. Contact fallback and vehicle categories should have a single configuration source; actual prices must remain database-owned.
- Startup invokes a seed function that can update existing demo receipts; database initialization also executes contact backfill. A normal server boot must not seed or change business records.
- The API has useful protections already: password hashing, HTTP-only expiring sessions, CSRF/origin checks, role checks, validation, audit events and restricted image uploads. These must be maintained. Verification updates need one transaction. Upload validation must stay outside controllers, with safe cleanup.
- SQL-heavy presentation produces repeated per-booking/per-vehicle lookups. The initial refactor should preserve behavior and transaction guarantees before optimizing queries; improvements must have contract tests.
- No ESLint/Prettier configuration exists. There are unused imports and files with entire components/functions compressed into one line. No consistent component ownership or manual-editing guide exists.

## Safe sequence and checkpoints

1. Save a read-only SQLite snapshot, per-table row counts/hashes and source baseline under ignored `output/refactor/`. Run the existing isolated tests/build.
2. Introduce `frontend/` and backend source modules. Extract existing functions/JSX with syntax-tree tooling, preserving markup and route contracts. Establish formatting/linting before substantive changes.
3. Split customer sections/pages, admin screens/layout/features and shared utilities. Allocate existing CSS rules to owning components while preserving their original cascade order through explicit CSS layers. Centralize content/images/tokens.
4. Replace custom server-state polling with TanStack Query; isolate theme and authentication contexts; keep public API behavior and workflow messages stable.
5. Separate API routes/controllers/services/repositories/validation. Add Prisma models mapped onto the existing tables. Preserve integer money, ISO timestamps, status checks and write-lock-before-conflict-check behavior.
6. Baseline migrations against a disposable copy, never reset or migrate the original database as part of automated validation. Ensure startup does not seed records. Run migration preservation, API, concurrency and role tests.
7. Run browser workflows on a disposable copy, compare light/dark screenshots and verify mobile/tablet/desktop layouts and animation behavior. Verify original business-table hashes are unchanged.
8. Deliver architecture, frontend/backend, booking, schema, editing and deployment guides with commands and remaining operational limitations.

## Explicit boundaries

This is a maintainability refactor. It does not add payment gateways, messaging providers, customer password accounts, new legal policies or a new visual design. Existing login/profile redirects and operational rules remain unless a specific defect is fixed and covered by a test. An unused notifications integration will not be invented.
