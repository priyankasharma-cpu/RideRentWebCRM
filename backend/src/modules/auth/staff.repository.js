import { findRecord } from '../../config/database.js';
import { all, run, get } from '../../config/database.js';
export async function listUserRecords(db) {
  return await all(db, 'SELECT id,name,email,role,active FROM users ORDER BY name');
}
export async function insertUser(db, key, name, value3, passwordHashValue, role, value6, nowValue) {
  return await run(
    db,
    'INSERT INTO users VALUES(?,?,?,?,?,?,?)',
    key,
    name,
    value3,
    passwordHashValue,
    role,
    value6,
    nowValue,
  );
}
export async function findUserById(db, id) {
  return await get(db, 'SELECT id FROM users WHERE id=?', id);
}
export async function updateUserByActiveAndId(db, active, id) {
  return await run(db, 'UPDATE users SET active=? WHERE id=?', active, id);
}
export async function deleteSessionByUserId(db, id) {
  return await run(db, 'DELETE FROM sessions WHERE user_id=?', id);
}
export async function findUserByIdVariant2(db, id) {
  return await findRecord(db, 'user', 'id', id);
}
export async function updateUserByPasswordHashAndId(db, passwordHashValue, id) {
  return await run(db, 'UPDATE users SET password_hash=? WHERE id=?', passwordHashValue, id);
}
export async function deleteSessionByUserIdVariant2(db, id, idValue) {
  return await run(db, 'DELETE FROM sessions WHERE user_id=? AND id<>?', id, idValue);
}
