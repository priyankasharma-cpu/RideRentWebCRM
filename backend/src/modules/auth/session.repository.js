import { get, run } from '../../config/database.js';
export const findSession = async (db, tokenHash, time) =>
  await get(db, 'SELECT * FROM sessions WHERE id=? AND expires_at>?', tokenHash, time);
export const findSessionUser = async (db, userId) =>
  await get(db, 'SELECT id,name,email,role FROM users WHERE id=? AND active=1', userId);
export const insertSession = async (db, tokenHash, userId, csrf, expiresAt) =>
  await run(db, 'INSERT INTO sessions VALUES(?,?,?,?)', tokenHash, userId, csrf, expiresAt);
export const removeExpiredSessions = async (db, time) =>
  await run(db, 'DELETE FROM sessions WHERE expires_at<?', time);
export const removeSession = async (db, tokenHash) =>
  await run(db, 'DELETE FROM sessions WHERE id=?', tokenHash);
export const findLoginUser = async (db, email) =>
  await get(db, 'SELECT * FROM users WHERE email=? AND active=1', email);
