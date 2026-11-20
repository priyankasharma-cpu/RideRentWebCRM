CREATE TABLE booking_access_challenges (
  id TEXT PRIMARY KEY,
  booking_id TEXT REFERENCES bookings(id),
  otp_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX booking_access_challenge_expiry
  ON booking_access_challenges(expires_at);

CREATE TABLE customer_access_sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  booking_ids TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX customer_access_session_owner_expiry
  ON customer_access_sessions(customer_id, expires_at);

CREATE INDEX customer_access_session_expiry
  ON customer_access_sessions(expires_at);
