# RideRent demonstration

1. Run `npm install`, `npm run setup`, then `npm run dev` with Node 24.14 or newer.
2. Open http://localhost:5173 and switch between light and dark. The preference survives reloads.
3. Select Bike, Scooter or Car. The layered road animation changes with the search category. Road markings, scenery, vehicle suspension and wheels animate separately; animation pauses offscreen and respects reduced motion.
4. Search a future pickup/return interval. Browse categories, price, fuel, transmission and sorting. Open a vehicle to see deposit, specifications and a server-calculated quote.
5. Book an available vehicle with fictional customer details. Accept the agreement. Keep the reference from the confirmation page. Nothing is charged online.
6. Open http://localhost:5173/admin. The generated email/password are in `.env`; no password is embedded in frontend code.
7. Open Bookings. Search the new reference and select Manage. The source is Website.
8. Open Create Booking and create a different phone or walk-in reservation. Existing customers can be selected. Availability and pricing use the same backend as online bookings.
9. Before pickup, verify the original driving license. Record rental and deposit receipts separately. Cash, UPI and Card are manual receipt methods, not gateway transactions.
10. Within one hour of the scheduled pickup, choose Mark as Picked Up. Enter odometer, fuel and condition. Actual pickup time and staff are recorded.
11. Choose Mark as Returned. Enter final odometer, fuel, condition, notes and any additional charges. Overdue fees are computed from the saved rate after the configured grace period. Vehicle remains blocked for inspection.
12. Settle remaining charges, then Complete Inspection & Close. Mark the vehicle road-ready or send it to maintenance. After closure, record the deposit refund from the receipt list.
13. Check overview and analytics. KPIs and charts come from database records; deposit receipts do not count as rental revenue.
14. On the customer website, use Find My Booking with reference and phone to retrieve the booking. Confirmed bookings can be cancelled or rescheduled before the configured cutoff.

## Seeded examples

The first database setup contains 8 bikes, 6 scooters, 6 cars, fictional customers, completed rentals, an active rental, an overdue rental, a future confirmed booking and a service block. References `RR-DEMO-0001` through `RR-DEMO-0006` correspond to fictional phone numbers `9000000001` through `9000000006`.

## Verification

- `npm test`: isolated, in-memory backend integration tests. Does not alter demo data.
- `npm run build`: production bundle.
- `npm run test:ui`: uses an isolated disposable database, without a running development server. Uses Microsoft Edge by default; set `PLAYWRIGHT_CHANNEL` to another installed supported browser if needed. Completes/refunds a fictional website rental and cancels a phone booking. Screenshots are saved in `backend/.artifacts/screenshots/`.

## Before using for a real agency

Replace the placeholder phone/address/email and sample policies in Admin → Settings. Replace illustrative stock/generated images, sample vehicle registrations and fictional records. Confirm tax, deposit and cancellation rules with the agency. Set a unique admin password and protect `.env` and the database. Review draft legal pages. Use HTTPS and a backup plan before collecting actual customer information. Real payment gateways, SMS, WhatsApp, document uploads/verification and multi-branch operations are not integrated.
