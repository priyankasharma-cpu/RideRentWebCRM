# Database schema

Prisma schema: backend/prisma/schema.prisma. SQLite remains the configured relational database. Existing tables are users, sessions, vehicles, customers, bookings, booking_contacts, rentals, payments, refunds, inspections, maintenance, settings and audit. Foreign keys, unique constraints and indexes preserve their relationships.

Bookings retain historical pricing and scheduled dates. Rentals store actual pickup/return. Booking contacts preserve customer details at booking time. Payments and refunds are separate ledger records. Inspections and maintenance control road readiness. Audit records retain staff activity.

Dates remain existing ISO strings for compatibility. Money and epoch values use Prisma BigInt, normalized at the API boundary. Migration 0001 baselines the existing schema; 0002 adds null identifier guards and session expiry indexing; 0003 indexes read paths. No business records are rewritten by these migrations.

Never use prisma migrate reset or db push against an existing client database. Back up first and validate migrations on a copy. See deployment.md.
