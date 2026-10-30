CREATE INDEX IF NOT EXISTS booking_status_window ON bookings(status,vehicle_id,starts_at,ends_at);
CREATE INDEX IF NOT EXISTS booking_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS payment_booking_created ON payments(booking_id,created_at);
CREATE INDEX IF NOT EXISTS refund_payment ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS inspection_rental_created ON inspections(rental_id,created_at);
CREATE INDEX IF NOT EXISTS maintenance_status_window ON maintenance(resolved,vehicle_id,starts_at,ends_at);
CREATE INDEX IF NOT EXISTS audit_created_at ON audit(created_at);
