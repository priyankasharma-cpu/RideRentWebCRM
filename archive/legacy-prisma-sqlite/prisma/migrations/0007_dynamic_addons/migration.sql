CREATE TABLE addons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  rate INTEGER NOT NULL CHECK(rate >= 0),
  billing TEXT NOT NULL CHECK(billing IN ('booking','hour')),
  stock INTEGER NOT NULL CHECK(stock >= 0),
  unserviceable INTEGER NOT NULL CHECK(unserviceable >= 0 AND unserviceable <= stock),
  max_quantity INTEGER NOT NULL CHECK(max_quantity > 0),
  enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
  archived_at TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE addon_categories (
  addon_id TEXT NOT NULL REFERENCES addons(id),
  category TEXT NOT NULL CHECK(category IN ('Bike','Scooter','Car')),
  included_quantity INTEGER NOT NULL CHECK(included_quantity >= 0),
  PRIMARY KEY(addon_id,category)
);
CREATE TABLE addon_allocations (
  id TEXT PRIMARY KEY,
  addon_id TEXT NOT NULL REFERENCES addons(id),
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  included_quantity INTEGER NOT NULL CHECK(included_quantity >= 0 AND included_quantity <= quantity),
  name TEXT NOT NULL,
  rate INTEGER NOT NULL CHECK(rate >= 0),
  billing TEXT NOT NULL CHECK(billing IN ('booking','hour')),
  base INTEGER NOT NULL CHECK(base >= 0),
  tax INTEGER NOT NULL CHECK(tax >= 0),
  version INTEGER NOT NULL,
  UNIQUE(addon_id,booking_id)
);
CREATE INDEX addon_allocations_booking ON addon_allocations(booking_id);
CREATE INDEX addon_allocations_stock ON addon_allocations(addon_id,booking_id);
