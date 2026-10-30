import { passwordMatches } from '../../utils/crypto.js';
import { fail } from '../../utils/ApiError.js';
import { audit } from '../audit/audit.service.js';
import { findLoginUser, removeSession } from './session.repository.js';
import { createSession } from './session.service.js';
export async function signIn(db, values, previousSession) {
  const user = await findLoginUser(db, values.email.toLowerCase());
  if (!user || !(await passwordMatches(values.password, user.password_hash)))
    fail(401, 'Email or password is incorrect.');
  await removeSession(db, previousSession.id);
  const session = await createSession(db, user.id);
  await audit(db, user.id, 'auth.login', user.id);
  return {
    session,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
export async function signOut(db, session) {
  await removeSession(db, session.id);
}
