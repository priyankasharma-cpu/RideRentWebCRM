import { collection, fromDocument, mongoOptions, queryGroup } from '../../config/mongoDatabase.js';

export async function findOtpBooking(db, reference, email) {
  const booking = await collection(db, 'bookings').findOne(
    { reference: { $regex: `^${escapeRegex(reference)}$`, $options: 'i' } },
    mongoOptions(db),
  );
  if (!booking) return null;
  const [contact, customer] = await Promise.all([
    collection(db, 'booking_contacts').findOne({ booking_id: booking.id }, mongoOptions(db)),
    collection(db, 'customers').findOne({ id: booking.customer_id }, mongoOptions(db)),
  ]);
  const contactEmail = String(contact?.email || '')
    .trim()
    .toLowerCase();
  const customerEmail = String(customer?.email || '')
    .trim()
    .toLowerCase();
  const savedEmail = contactEmail === email ? contactEmail : customerEmail;
  if (savedEmail !== email) return null;
  return { id: booking.id, customer_id: booking.customer_id, email: savedEmail };
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function insertChallenge(db, row) {
  await collection(db, 'booking_access_challenges').insertOne(
    {
      _id: row.id,
      id: row.id,
      booking_id: row.bookingId,
      otp_hash: row.otpHash,
      attempts: 0,
      expires_at: row.expiresAt,
      consumed_at: null,
      created_at: row.createdAt,
    },
    mongoOptions(db),
  );
}

export async function findChallenge(db, id) {
  return fromDocument(
    await collection(db, 'booking_access_challenges').findOne({ id }, mongoOptions(db)),
  );
}

export async function findChallengeBooking(db, bookingId) {
  const booking = await collection(db, 'bookings').findOne(
    { id: bookingId },
    { ...mongoOptions(db), projection: { id: 1, customer_id: 1 } },
  );
  return booking ? { id: booking.id, customer_id: booking.customer_id } : null;
}

export async function bookingIdsForChallenge(db, bookingId) {
  const membership = await collection(db, 'checkout_items').findOne(
    { booking_id: bookingId },
    mongoOptions(db),
  );
  if (!membership) return [{ id: bookingId }];
  const rows = await collection(db, 'checkout_items')
    .find({ order_id: membership.order_id }, mongoOptions(db))
    .toArray();
  return rows.map((row) => ({ id: row.booking_id }));
}

export async function updateChallengeAttempts(db, id, attempts) {
  await collection(db, 'booking_access_challenges').updateOne(
    { id },
    { $set: { attempts } },
    mongoOptions(db),
  );
}

export async function consumeChallenge(db, id, at) {
  await collection(db, 'booking_access_challenges').updateOne(
    { id, consumed_at: null },
    { $set: { consumed_at: at } },
    mongoOptions(db),
  );
}

export async function insertAccessSession(db, row) {
  await collection(db, 'customer_access_sessions').insertOne(
    {
      _id: row.tokenHash,
      token_hash: row.tokenHash,
      customer_id: row.customerId,
      booking_ids: JSON.stringify(row.bookingIds),
      expires_at: row.expiresAt,
      created_at: row.createdAt,
    },
    mongoOptions(db),
  );
}

export async function findAccessSession(db, tokenHash, at) {
  const session = await collection(db, 'customer_access_sessions').findOne(
    { token_hash: tokenHash, expires_at: { $gt: at } },
    mongoOptions(db),
  );
  if (!session) return null;
  return {
    customer_id: session.customer_id,
    booking_ids: session.booking_ids,
    expires_at: session.expires_at,
  };
}

export async function removeExpiredAccessData(db, at) {
  await queryGroup(db, [
    () =>
      collection(db, 'customer_access_sessions').deleteMany(
        { expires_at: { $lte: at } },
        mongoOptions(db),
      ),
    () =>
      collection(db, 'booking_access_challenges').deleteMany(
        {
          $or: [
            { expires_at: { $lte: at } },
            { consumed_at: { $ne: null, $lt: at - 24 * 60 * 60 * 1000 } },
          ],
        },
        mongoOptions(db),
      ),
  ]);
}
