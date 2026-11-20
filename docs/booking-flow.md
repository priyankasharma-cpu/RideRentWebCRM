# Booking flow

1. Website search requests fleet availability for a scheduled interval.
2. A server quote calculates rounded billable hours, configured tax and deposit.
3. The shared booking service starts a transaction, locks writes, rechecks availability and stores a historical rate snapshot. Online, phone and walk-in entry points share this path. Configured add-ons use the same quote/inventory allocator, including category-included quantities.
4. Initial customer confirmation uses a short-lived, HTTP-only session scoped to the created booking/order. Returning customers request a one-time email code using their booking reference and email. Staff access requires a valid session and role.
5. Staff verify the license, collect required receipts and record actual pickup separately from scheduled pickup.
6. Return records actual return time and calculates overdue charges using historical rates and the configured grace policy.
7. Inspection, balance settlement and deposit refund complete the rental. Failed road-readiness inspection creates maintenance before release.

Adjacent reservations are allowed; overlapping reservations are rejected. An active or overdue rental and unresolved started maintenance block availability until staff explicitly resolve the workflow. Cancellation releases its reserved interval. Audit records capture staff changes.
