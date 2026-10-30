import {
  listUserRecords,
  insertUser,
  findUserById,
  updateUserByActiveAndId,
  deleteSessionByUserId,
  findUserByIdVariant2,
  updateUserByPasswordHashAndId,
  deleteSessionByUserIdVariant2,
} from './staff.repository.js';
import { id, passwordHash, passwordMatches } from '../../utils/crypto.js';
import { now } from '../../utils/dateTime.js';
import { audit } from '../audit/audit.service.js';
import { fail } from '../../utils/ApiError.js';
import { transaction } from '../../config/database.js';
export async function listStaff(db, _request) {
  return await listUserRecords(db);
}
export async function addStaff(db, request) {
  const u = request.body;
  const key = id();
  await insertUser(
    db,
    key,
    u.name,
    u.email.toLowerCase(),
    await passwordHash(u.password),
    u.role,
    1,
    now(),
  );
  await audit(db, request.user.id, 'staff.created', key);
  return {
    ok: true,
  };
}
export async function changeStaffAccess(db, request) {
  const v = request.body;
  if (request.params.id === request.user.id) fail(400, 'You cannot disable your own account.');
  if (!(await findUserById(db, request.params.id))) fail(404, 'Staff account not found.');
  await transaction(db, async () => {
    await updateUserByActiveAndId(db, v.active ? 1 : 0, request.params.id);
    if (!v.active) await deleteSessionByUserId(db, request.params.id);
    await audit(db, request.user.id, 'staff.status_updated', request.params.id, v);
  });
  return {
    ok: true,
  };
}
export async function changePassword(db, request) {
  const v = request.body;
  const u = await findUserByIdVariant2(db, request.user.id);
  if (!(await passwordMatches(v.current, u.password_hash)))
    fail(400, 'Current password is incorrect.');
  await updateUserByPasswordHashAndId(db, await passwordHash(v.password), request.user.id);
  await deleteSessionByUserIdVariant2(db, request.user.id, request.session.id);
  await audit(db, request.user.id, 'auth.password_changed', request.user.id);
  return {
    ok: true,
  };
}
