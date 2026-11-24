import { AsyncLocalStorage } from 'node:async_hooks';
import { MongoClient } from 'mongodb';
import { env } from './env.js';
import { configureMongoDns } from './mongoDns.js';

const transactionContext = new AsyncLocalStorage();
const transactionLockId = 'riderent-write-queue';

export function mongoOptions(database, options = {}) {
  const context = transactionContext.getStore();
  if (context?.database !== database) return options;
  return { ...options, session: context.session };
}

export function isInTransaction(database) {
  return transactionContext.getStore()?.database === database;
}

export async function queryGroup(database, operations) {
  if (isInTransaction(database)) {
    const results = [];
    for (const operation of operations) results.push(await operation());
    return results;
  }
  return Promise.all(operations.map((operation) => operation()));
}

export function collection(database, name) {
  if (!database?.db) throw new Error('MongoDB database connection is not available.');
  return database.db.collection(name);
}

export function fromDocument(document) {
  if (!document) return document;
  const record = { ...document };
  delete record._id;
  delete record._migration_order;
  return record;
}

export function fromDocuments(documents) {
  return documents.map(fromDocument);
}

export async function withTransaction(database, callback) {
  const active = transactionContext.getStore();
  if (active?.database === database) return callback();

  const session = database.client.startSession();
  try {
    return await session.withTransaction(
      async () => {
        await transactionContext.run({ database, session }, async () => {
          // A shared write document preserves SQLite's serialized availability checks.
          await collection(database, 'system_locks').updateOne(
            { _id: transactionLockId },
            { $inc: { version: 1 } },
            { session, upsert: true },
          );
        });

        return transactionContext.run({ database, session }, callback);
      },
      {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        readPreference: 'primary',
      },
    );
  } finally {
    await session.endSession();
  }
}

export async function openMongoDb({
  uri = env.MONGODB_URI,
  databaseName = env.MONGODB_DB_NAME,
} = {}) {
  if (!uri) throw new Error('MONGODB_URI is required to start the MongoDB backend.');
  if (!databaseName)
    throw new Error('MONGODB_DB_NAME is required to select the application database.');
  configureMongoDns();

  const client = new MongoClient(uri, {
    appName: 'RideRent',
    tls: true,
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10_000,
    retryWrites: true,
  });

  try {
    await client.connect();
    const db = client.db(databaseName);
    await db.command({ ping: 1 });
    await ensureIndexes(db);
    await db
      .collection('system_locks')
      .updateOne({ _id: transactionLockId }, { $setOnInsert: { version: 0 } }, { upsert: true });

    return {
      client,
      db,
      async close() {
        await client.close();
      },
    };
  } catch (error) {
    await client.close().catch(() => {});
    throw error;
  }
}

async function ensureIndexes(db) {
  const definitions = {
    users: [
      { key: { id: 1 }, options: { unique: true, name: 'users_id_unique' } },
      { key: { email: 1 }, options: { unique: true, name: 'users_email_unique' } },
    ],
    vehicles: [
      { key: { id: 1 }, options: { unique: true, name: 'vehicles_id_unique' } },
      { key: { slug: 1 }, options: { unique: true, name: 'vehicles_slug_unique' } },
      { key: { registration: 1 }, options: { unique: true, name: 'vehicles_registration_unique' } },
      { key: { name: 1 }, options: { name: 'vehicles_name' } },
    ],
    customers: [
      { key: { id: 1 }, options: { unique: true, name: 'customers_id_unique' } },
      { key: { phone: 1 }, options: { unique: true, name: 'customers_phone_unique' } },
      { key: { created_at: -1 }, options: { name: 'customers_created' } },
    ],
    bookings: [
      { key: { id: 1 }, options: { unique: true, name: 'bookings_id_unique' } },
      { key: { reference: 1 }, options: { unique: true, name: 'bookings_reference_unique' } },
      {
        key: { vehicle_id: 1, status: 1, starts_at: 1, ends_at: 1 },
        options: { name: 'bookings_vehicle_period' },
      },
      { key: { customer_id: 1, created_at: -1 }, options: { name: 'bookings_customer_created' } },
      { key: { created_at: -1 }, options: { name: 'bookings_created' } },
      { key: { starts_at: 1, status: 1 }, options: { name: 'bookings_finance_start_status' } },
      {
        key: { finance_source: 1, starts_at: 1 },
        options: { name: 'bookings_finance_source_start' },
      },
      { key: { status: 1, ends_at: 1 }, options: { name: 'bookings_finance_status_end' } },
    ],
    booking_contacts: [
      {
        key: { booking_id: 1 },
        options: { unique: true, name: 'booking_contacts_booking_unique' },
      },
    ],
    checkout_orders: [
      { key: { submission_key: 1 }, options: { unique: true, name: 'checkout_submission_unique' } },
    ],
    checkout_items: [
      { key: { booking_id: 1 }, options: { name: 'checkout_items_booking' } },
      {
        key: { order_id: 1, _migration_order: 1 },
        options: { name: 'checkout_items_order_position' },
      },
    ],
    contact_inquiries: [
      { key: { id: 1 }, options: { unique: true, name: 'contact_inquiry_id_unique' } },
      { key: { submission_key: 1 }, options: { unique: true, name: 'contact_submission_unique' } },
      { key: { status: 1, created_at: -1 }, options: { name: 'contact_inquiry_status_created' } },
    ],
    addons: [
      { key: { id: 1 }, options: { unique: true, name: 'addons_id_unique' } },
      { key: { code: 1 }, options: { unique: true, name: 'addons_code_unique' } },
    ],
    addon_categories: [
      {
        key: { addon_id: 1, category: 1 },
        options: { unique: true, name: 'addon_category_unique' },
      },
    ],
    addon_allocations: [
      { key: { id: 1 }, options: { unique: true, name: 'addon_allocations_id_unique' } },
      {
        key: { addon_id: 1, booking_id: 1 },
        options: { unique: true, name: 'addon_allocations_addon_booking_unique' },
      },
      { key: { booking_id: 1, addon_id: 1 }, options: { name: 'addon_allocations_booking_addon' } },
    ],
    sessions: [
      { key: { id: 1 }, options: { unique: true, name: 'sessions_id_unique' } },
      { key: { expires_at: 1 }, options: { name: 'sessions_expiry' } },
    ],
    refunds: [
      { key: { id: 1 }, options: { unique: true, name: 'refunds_id_unique' } },
      { key: { payment_id: 1 }, options: { name: 'refunds_payment' } },
      { key: { created_at: 1 }, options: { name: 'refunds_finance_date' } },
      {
        key: { submission_key: 1 },
        options: { unique: true, sparse: true, name: 'refunds_submission' },
      },
      {
        key: { reference_key: 1 },
        options: { unique: true, sparse: true, name: 'refunds_finance_reference' },
      },
    ],
    inspections: [
      { key: { id: 1 }, options: { unique: true, name: 'inspections_id_unique' } },
      { key: { rental_id: 1, created_at: 1 }, options: { name: 'inspections_rental_created' } },
    ],
    audit: [
      { key: { created_at: 1 }, options: { name: 'audit_created' } },
      {
        key: { entity_id: 1, action: 1, created_at: -1 },
        options: { name: 'audit_finance_entity_action' },
      },
    ],
    expenses: [
      { key: { date: 1 }, options: { name: 'expenses_date' } },
      { key: { status: 1, date: 1 }, options: { name: 'expenses_status_date' } },
      { key: { category: 1, date: 1 }, options: { name: 'expenses_category_date' } },
    ],
    finance_adjustments: [
      { key: { date: 1 }, options: { name: 'finance_adjustments_date' } },
      { key: { kind: 1, date: 1 }, options: { name: 'finance_adjustments_kind_date' } },
      { key: { bookingId: 1, kind: 1 }, options: { name: 'finance_adjustments_booking_kind' } },
    ],
    rentals: [
      { key: { id: 1 }, options: { unique: true, name: 'rentals_id_unique' } },
      { key: { booking_id: 1 }, options: { unique: true, name: 'rentals_booking_unique' } },
      { key: { return_at: 1 }, options: { name: 'rentals_finance_return' } },
    ],
    payments: [
      { key: { id: 1 }, options: { unique: true, name: 'payments_id_unique' } },
      { key: { booking_id: 1, created_at: -1 }, options: { name: 'payments_booking_created' } },
      { key: { created_at: 1 }, options: { name: 'payments_finance_date' } },
      { key: { status: 1, created_at: 1 }, options: { name: 'payments_finance_status_date' } },
      { key: { purpose: 1, created_at: 1 }, options: { name: 'payments_finance_purpose_date' } },
      {
        key: { submission_key: 1 },
        options: { unique: true, sparse: true, name: 'payments_submission' },
      },
      {
        key: { reference_key: 1 },
        options: { unique: true, sparse: true, name: 'payments_finance_reference' },
      },
    ],
    booking_addons: [
      { key: { booking_id: 1 }, options: { unique: true, name: 'booking_addons_booking_unique' } },
    ],
    vehicle_images: [
      {
        key: { vehicle_id: 1, id: 1 },
        options: { unique: true, name: 'vehicle_images_id_unique' },
      },
      {
        key: { vehicle_id: 1, position: 1 },
        options: { unique: true, name: 'vehicle_images_position_unique' },
      },
      {
        key: { vehicle_id: 1, url: 1 },
        options: { unique: true, name: 'vehicle_images_url_unique' },
      },
    ],
    settings: [{ key: { id: 1 }, options: { unique: true, name: 'settings_id_unique' } }],
    booking_access_challenges: [
      { key: { id: 1 }, options: { unique: true, name: 'booking_challenges_id_unique' } },
      { key: { expires_at: 1 }, options: { name: 'booking_challenges_expiry' } },
    ],
    customer_access_sessions: [
      { key: { token_hash: 1 }, options: { unique: true, name: 'customer_sessions_token_unique' } },
      {
        key: { customer_id: 1, expires_at: 1 },
        options: { name: 'customer_sessions_owner_expiry' },
      },
      { key: { expires_at: 1 }, options: { name: 'customer_sessions_expiry' } },
    ],
    maintenance: [
      { key: { id: 1 }, options: { unique: true, name: 'maintenance_id_unique' } },
      {
        key: { resolved: 1, vehicle_id: 1, starts_at: 1, ends_at: 1 },
        options: { name: 'maintenance_status_period' },
      },
      {
        key: { vehicle_id: 1, resolved: 1, starts_at: 1, ends_at: 1 },
        options: { name: 'maintenance_vehicle_period' },
      },
    ],
  };

  for (const [name, indexes] of Object.entries(definitions)) {
    for (const { key, options } of indexes) {
      await db.collection(name).createIndex(key, options);
    }
  }
}
