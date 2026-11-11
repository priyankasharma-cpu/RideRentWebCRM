CREATE TABLE checkout_orders (
  id TEXT PRIMARY KEY,
  submission_key TEXT NOT NULL UNIQUE,
  input_hash TEXT NOT NULL,
  access_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE checkout_items (
  booking_id TEXT PRIMARY KEY REFERENCES bookings(id),
  order_id TEXT NOT NULL REFERENCES checkout_orders(id)
);
CREATE INDEX checkout_items_order ON checkout_items(order_id);
CREATE TABLE booking_addons (
  booking_id TEXT PRIMARY KEY REFERENCES bookings(id),
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  rate INTEGER NOT NULL CHECK(rate >= 0),
  billing TEXT NOT NULL CHECK(billing IN ('booking','hour')),
  base INTEGER NOT NULL CHECK(base >= 0),
  tax INTEGER NOT NULL CHECK(tax >= 0)
);
