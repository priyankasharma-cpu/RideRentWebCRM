# Finance management

Open **Admin → Finance Management**. The section contains Finance Overview, Revenue Analytics, Website Revenue, Walk-in Revenue, Transactions, Expenses, Profit & Loss, and Financial Reports. Finance uses the existing admin session and CSRF checks. Every finance endpoint requires the **admin** role. RideRent currently has two roles, so finance actions share that grant. The existing booking and payment screens keep their existing role permissions.

## Data and financial rules

- **Sources.** New bookings persist `bookings.finance_source` with `website`, `walk_in`, or `unknown`. Public reservations and checkouts are marked as website. Staff choose the source when recording a manual booking. Phone and unspecified manual bookings are unclassified in finance. Existing booking-channel labels remain available on the booking screen.
- **Historical classification.** The canonical field takes precedence. Read-time classification uses explicit historical Walk-in labels, checkout membership, and public booking-creation audit events as evidence. Older Website labels alone are ambiguous because the manual booking API also accepted and defaulted to that label. Such records, Phone bookings, and other records without sufficient evidence appear as Unclassified. Combined revenue includes all three categories. No source records are rewritten.
- **Gross booking value.** For the period's scheduled pickups, sum each non-cancelled vehicle booking's base, extra charges, add-ons, and recorded taxes before discounts. Refundable deposits are excluded.
- **Gross rental revenue.** Sum base rental charges, extra charges, and persisted add-on charge snapshots on completed vehicle bookings. Taxes are excluded. Recognition uses the actual return date, or scheduled end for a completed legacy booking without a return timestamp. A booking that is still awaiting completion contributes to the booking-value and outstanding metrics when in scope.
- **Net recognized revenue.** Subtract explicit booking discounts and add signed authorized revenue adjustments, including retained cancellation fees. Retained fees require an explicit cancellation fee entry. A cancellation fee requires a cancelled booking and may not exceed its retained rental payments. Reverse a recognized fee before issuing a rental refund that would reduce retained payments below it.
- **Collections and refunds.** Rental payments count at the recorded receipt time. Rental refunds count at the actual recorded refund time. A completed historical posting can have a missing status because the legacy collections stored only completed postings. Failed, voided, and pending rows can appear in the ledger and are excluded from totals. Deposit transactions use their own ledger types and are excluded from rental payments, refunds, and P&L.
- **Net collections.** Completed rental receipts minus completed rental refunds. A cancelled booking can still have both.
- **Outstanding rental payments.** For non-cancelled bookings with a scheduled pickup in the selected period, sum each positive rental invoice balance including recorded taxes, less explicit discounts and net rental payments recorded through period end. Booking state and invoice charge components use their currently available values. Existing bookings do not have a complete effective-dated invoice revision history.
- **Deposits.** Deposit receipts and returns are shown separately. Net movement applies to the selected period. Refundable deposits held use all completed deposit activity through the period cutoff, including opening balances.
- **Bookings and average booking value.** A positive completed member charge or positive net cancellation fee qualifies its checkout order, or its standalone booking, once per comparison period. The order is counted in the earliest qualifying bucket in that period. Each member's revenue is assigned to its own vehicle and recognition date. Average booking value divides recognized revenue by the qualifying order count and rounds to nearest paise.
- **Operating expenses.** Completed expenses minus dated reversal entries. Pending and voided expenses stay visible in the expense register. Expenses can be shared across the shop or assigned to a vehicle. Category and vehicle filters include costs assigned to matching vehicles. Source filters omit expenses because expenses have no booking source.
- **Operating profit and margin.** Recognized revenue minus operating expenses. Margin is profit divided by positive recognized revenue. Source and vehicle-filtered figures cover only the costs described above and can differ from the shop-wide margin.
- **Comparison periods.** Shop-local days use half-open UTC boundaries. Weeks start Monday. Standard presets compare to the full preceding calendar period. Custom ranges compare to the preceding equal number of local calendar days. A zero previous value leaves percentage change unavailable. The default reporting timezone is `Asia/Kolkata`.

Amounts in JSON are exact integer paise, except percentage metrics. Exported amounts are in INR. Recording a receipt or refund logs a completed external money movement. Complete external transfers before recording them. Existing refund rules allow rental refunds for cancelled bookings and deposit returns after cancellation or completion.

## Finance API

All routes below are relative to `/api/admin/finance`. Read responses include period metadata when applicable. List responses contain `rows`, `total`, `page`, and `limit`. Mutations use the standard RideRent CSRF header and JSON body.

### Reports and read endpoints

- `GET /overview` returns `current`, `previous`, `changes`, `series`, `sources`, `categories`, `vehicles`, and `methods`.
- `GET /revenue-trends`, `/revenue-by-source`, `/revenue-by-category`, `/revenue-by-vehicle`, and `/payment-methods` expose the corresponding slices of the same engine.
- `GET /profit-loss` returns period totals, comparison, and trend data.
- `GET /transactions` returns the unified ledger, with booking, vehicle, customer name, staff, external reference, and status where available.
- `GET /expenses` returns the expense register. `GET /expenses/:id/history` returns the 100 most recent audit events for an expense.
- `GET /bookings?search=RR-...` returns up to 15 booking-reference matches for the transaction forms.
- `GET /reports/export` downloads a report with the shop, period, currency, filters, report totals, and applicable ledger rows. `format` is `csv`, `xlsx`, or `pdf`. `report` is `summary`, `source`, `vehicle`, `transactions`, `expenses`, or `profit-loss`. Exports support up to 5,000 matching ledger rows per file. Narrow the range or filters for larger exports.

Common report query parameters:

- `period` defaults to `this_month`. Options are `today`, `yesterday`, `this_week`, `last_week`, `this_month`, `last_month`, `this_quarter`, `this_year`, `last_year`, and `custom`. Custom dates use inclusive `from` and `to` in `YYYY-MM-DD`, with a maximum of ten years.
- `source`, `category` (`Bike`, `Scooter`, `Car`), `vehicleId`, and `interval` (`day`, `week`, `month`, `quarter`, `year`).
- Ledger filters include `search`, `method`, `status`, `type`, `expenseCategory`, `sort` (`newest`, `oldest`, `highest`, `lowest`), `page`, and `limit` (up to 100). Financial statement totals use date and booking dimensions. Transaction or expense report subtotals honor the additional ledger filters.

### Mutations

- `POST /bookings/:id/payments` records a completed receipt. Send integer `amount`, `purpose` (`rental` or `deposit`), `method`, optional `reference` and `note`, and UUID `submissionKey`.
- `POST /payments/:id/refund` records a full or partial refund or deposit return. Send integer `amount`, `reason`, optional `reference`, and UUID `submissionKey`. The original payment determines the method and type.
- `POST /adjustments` posts a signed accounting entry with `bookingId`, nonzero integer `amount`, `kind` (`revenue_adjustment` or `cancellation_fee`), shop-local `date`, `notes`, optional `reference`, and UUID `submissionKey`. Corrections use a new opposite-signed entry.
- `POST /expenses` records `title`, `category`, integer `amount`, shop-local `date`, `method`, optional `vehicleId`, `status`, optional `vendor`, `notes` and `receipt`, and UUID `submissionKey`.
- `PATCH /expenses/:id` accepts the expense fields and current integer `version`. Pending expenses can be settled or voided. Settled accounting fields are locked and voided expenses cannot be reopened. Descriptive fields remain editable.
- `POST /expenses/:id/reverse` appends a separate negative expense with the original accounting dimensions. Send the current `version`, effective `date`, `notes`, and UUID `submissionKey`.

Idempotent retries require the same key and payload. A conflicting retry or stale write returns 409. Invalid inputs return 400, missing authentication returns 401, incorrect role or CSRF returns 403, missing referenced records return 404, and an oversized export returns 422.

## Database and deployment

Finance reuses the application's native MongoDB connection, sessions, transactions, `bookings`, `rentals`, `checkout_items`, add-on snapshots, `payments`, `refunds`, and `audit` collections. The only new financial collections are:

- `expenses` stores integer paise, effective timestamps, payment status, optional vehicle and receipt references, actor, version, and reversal linkage.
- `finance_adjustments` stores a signed integer paise amount, booking, kind, effective timestamp, note, reference, and actor.

`payments` and `refunds` accept optional submission and reference fields with sparse unique indexes. The existing serialized mutation transaction checks balances, prevents concurrent overpayments or over-refunds, and commits the associated audit event together with the posting. Expense reversals and revenue adjustments preserve the original records. Receipt references point to external storage or an external receipt identifier.

Deploy the backend before the frontend. The normal Render startup creates the finance indexes idempotently using the existing Atlas account and environment. The DB user needs the same transaction and index creation privileges as the existing application. The Vercel build adds the finance route and lazy-loaded chunks. Use the current deployment secrets and external receipt references. Historical classification takes effect on the first read. Custom downloads are computed on the server from the active filters.

Finance queries use bounded date ranges, indexed booking/return/transaction candidates, native MongoDB grouping, server-side ledger pagination, and a 15-second query timeout. Frontend reads are deduplicated and briefly cached by user and filters, with cancellation and mutation invalidation. Charts and the ledger load as separate lazy chunks. Larger exports are explicitly capped to bound Render memory usage.

## Verification commands

- `npm run lint`
- `npm --prefix backend test`
- `node --test frontend/tests/*.test.js`
- `npm run build`
- `npm --prefix backend run test:mongodb`
- Set `RIDERENT_FINANCE_UI_TEST=1` when running the MongoDB suite to exercise the production build with installed Playwright Chromium. The suite uses randomly named `riderent_test_*` databases and removes those test databases after use.

## Measured baseline

A read-only booking-year report against the configured Atlas database produced 12 chart buckets, 17 ledger rows, and a 3,509-byte overview response. At the local workstation, six consecutive runs measured 363 ms on the first overview and a 93 ms median across the next five. The first ledger page took 118 ms, with an 81 ms median across the next five. Complete downloads took 263 ms for CSV, 366 ms for Excel, and 609 ms for PDF. These timings include Atlas reads and local rendering. The dataset is small and the benchmark for production-scale concurrency remains open.

The production build emitted approximately 7.18 kB gzip for the finance page, 4.99 kB for its ledger and forms chunk, and 64.65 kB for its Chart.js chunk. The ledger and charts have separate load triggers. Isolated Atlas tests exercise the date, source, status, and expense indexes and verify their index scans with MongoDB explain plans.

## Implementation files

- The admin pages, query hooks, formatting, forms, charts, and component styles are in `frontend/src/admin/finance/`. Route and navigation integration lives in `frontend/src/admin/routes.jsx`, `frontend/src/config/adminNavigation.js`, and `frontend/src/admin/components/AdminSidebar.jsx` and its stylesheet.
- `CreateBooking.jsx` and `BookingManagement.jsx` expose the source options. The existing `PaymentForm.jsx`, `useResource.js`, and `apiClient.js` provide receipt keys and references, optional fetches, and cache invalidation across legacy booking and payment actions.
- The backend finance module lives in `backend/src/modules/finance/`. `backend/src/app.js` mounts it, `backend/src/config/mongoDatabase.js` installs its indexes, and the booking and payment modules persist source and receipt metadata and enforce balances.
- Both package manifests and lockfiles include the finance dependencies. Finance tests live in `backend/tests/unit/finance.test.js`, `backend/tests/mongodb/finance.test.js`, and `frontend/tests/finance.test.js`.
