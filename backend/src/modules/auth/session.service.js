import { randomBytes } from 'node:crypto';
import { hash } from '../../utils/crypto.js';
import {
  findSession,
  findSessionUser,
  insertSession,
  removeExpiredSessions,
} from './session.repository.js';
export const SESSION_DURATION_MS = 8 * 3_600_000;
export async function getSessionAndUser(db, cookie) {
  const session = cookie ? await findSession(db, hash(cookie), Date.now()) : null;
  const user = session?.user_id ? await findSessionUser(db, session.user_id) : null;
  return {
    session,
    user,
  };
}
export async function createSession(db, userId = null) {
  const token = randomBytes(32).toString('hex');
  const csrf = randomBytes(24).toString('hex');
  await removeExpiredSessions(db, Date.now());
  await insertSession(db, hash(token), userId, csrf, Date.now() + SESSION_DURATION_MS);
  return {
    token,
    csrf,
  };
}
