import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { env, isProduction } from '../../config/env.js';
import { withTransaction } from '../../config/mongoDatabase.js';
import { fail } from '../../utils/ApiError.js';
import { hash, id } from '../../utils/crypto.js';
import * as repository from './bookingAccess.repository.js';

export const CUSTOMER_ACCESS_DURATION_MS = 8 * 60 * 60 * 1000;
export const OTP_DURATION_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const developmentOtpSecret = randomBytes(32);
const genericRequestMessage =
  'If those details match a booking, a code may arrive at the saved email. If it does not, request a new code or contact the shop.';
const genericVerificationError =
  'The verification code is invalid or expired. Request a new code and try again.';
const productionDeliveryConfigured = Boolean(
  env.RESEND_API_KEY && env.OTP_FROM_EMAIL && env.OTP_HASH_SECRET,
);

const otpDigest = (challengeId, code) =>
  createHmac('sha256', env.OTP_HASH_SECRET || developmentOtpSecret)
    .update(`${challengeId}:${code}`)
    .digest();

const equalDigest = (left, right) => {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function deliverBookingOtp({ email, code, expiresMinutes }) {
  if (isProduction) {
    if (!env.RESEND_API_KEY || !env.OTP_FROM_EMAIL || !env.OTP_HASH_SECRET)
      throw new Error('Production booking verification delivery is not configured.');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.OTP_FROM_EMAIL,
        to: [email],
        subject: 'Your RideRent verification code',
        text: `Your RideRent verification code is ${code}. It expires in ${expiresMinutes} minutes and can be used once. If you did not request it, ignore this email.`,
      }),
    });
    if (!response.ok) throw new Error(`OTP provider returned ${response.status}.`);
    return;
  }
  console.info(`[development booking OTP] ${email}: ${code}`);
}

export async function requestBookingOtp(
  db,
  raw,
  { deliver = deliverBookingOtp, deferDelivery = false } = {},
) {
  if (isProduction && !productionDeliveryConfigured)
    fail(503, 'Email verification is temporarily unavailable. Please contact the shop for help.');
  if (!(await accessTablesInstalled(db)))
    fail(
      503,
      'Customer verification is not installed. Apply migration 0008_customer_access_security.',
    );
  const email = raw.email.trim().toLowerCase();
  const reference = raw.reference.trim().toUpperCase();
  const booking = await repository.findOtpBooking(db, reference, email);
  const challengeId = id();
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const at = Date.now();
  await withTransaction(db, async () => {
    await repository.removeExpiredAccessData(db, at);
    await repository.insertChallenge(db, {
      id: challengeId,
      bookingId: booking?.id || null,
      otpHash: otpDigest(challengeId, code).toString('hex'),
      expiresAt: at + OTP_DURATION_MS,
      createdAt: at,
    });
  });
  const result = {
    challengeId,
    message: genericRequestMessage,
    expiresInSeconds: OTP_DURATION_MS / 1000,
  };
  if (!booking) return result;

  const dispatch = async () => {
    try {
      await deliver({ email: booking.email, code, expiresMinutes: OTP_DURATION_MS / 60000 });
    } catch (error) {
      // Keep the public response identical whether the email was known or delivery failed.
      console.error('Booking verification delivery failed:', error.message);
    }
  };
  if (deferDelivery) return { ...result, dispatch };
  await dispatch();
  return result;
}

export async function verifyBookingOtp(db, { challengeId, code }) {
  const at = Date.now();
  const outcome = await withTransaction(db, async () => {
    const challenge = await repository.findChallenge(db, challengeId);
    if (
      !challenge ||
      !challenge.booking_id ||
      challenge.consumed_at ||
      challenge.expires_at <= at ||
      challenge.attempts >= MAX_OTP_ATTEMPTS
    )
      return null;
    const valid = equalDigest(challenge.otp_hash, otpDigest(challengeId, code).toString('hex'));
    if (!valid) {
      await repository.updateChallengeAttempts(db, challengeId, challenge.attempts + 1);
      return null;
    }
    await repository.consumeChallenge(db, challengeId, at);
    const booking = await repository.findChallengeBooking(db, challenge.booking_id);
    if (!booking) return null;
    const rows = await repository.bookingIdsForChallenge(db, booking.id);
    const bookingIds = rows.map((row) => row.id);
    if (!bookingIds.includes(booking.id)) bookingIds.push(booking.id);
    return { customerId: booking.customer_id, bookingIds };
  });
  if (!outcome) fail(400, genericVerificationError);
  return await createCustomerAccessSession(db, outcome.customerId, outcome.bookingIds);
}

export async function createCustomerAccessSession(db, customerId, bookingIds) {
  if (!(await accessTablesInstalled(db)))
    fail(
      503,
      'Customer verification is not installed. Apply migration 0008_customer_access_security.',
    );
  if (!bookingIds.length) fail(403, genericVerificationError);
  const token = randomBytes(32).toString('hex');
  const at = Date.now();
  const session = {
    tokenHash: hash(token),
    customerId,
    bookingIds: [...new Set(bookingIds)],
    expiresAt: at + CUSTOMER_ACCESS_DURATION_MS,
    createdAt: at,
  };
  await withTransaction(db, async () => {
    await repository.removeExpiredAccessData(db, at);
    await repository.insertAccessSession(db, session);
  });
  return { token, expiresAt: session.expiresAt, bookingIds: session.bookingIds };
}

export async function getCustomerAccessSession(db, token) {
  if (!token || !(await accessTablesInstalled(db))) return null;
  const session = await repository.findAccessSession(db, hash(token), Date.now());
  if (!session) return null;
  let bookingIds;
  try {
    bookingIds = JSON.parse(session.booking_ids);
  } catch {
    return null;
  }
  if (!Array.isArray(bookingIds) || bookingIds.some((value) => typeof value !== 'string'))
    return null;
  return { customer_id: session.customer_id, booking_ids: bookingIds };
}

export async function accessTablesInstalled() {
  return true;
}
