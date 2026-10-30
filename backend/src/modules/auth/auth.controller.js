import { isProduction } from '../../config/env.js';
import { createSession, SESSION_DURATION_MS } from './session.service.js';
import { signIn, signOut } from './auth.service.js';
function setSessionCookie(res, session) {
  res.cookie('rr_session', session.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: SESSION_DURATION_MS,
    path: '/',
  });
}
export const getSessionController = (db) => async (req, res) => {
  res.set('Cache-Control', 'no-store');
  let csrf = req.session?.csrf;
  if (!csrf) {
    const session = await createSession(db);
    setSessionCookie(res, session);
    csrf = session.csrf;
  }
  res.json({
    user: req.user || null,
    csrf,
  });
};
export const signInController = (db) => async (req, res) => {
  const { session, user } = await signIn(db, req.validated.body, req.session);
  setSessionCookie(res, session);
  res.json({
    user,
    csrf: session.csrf,
  });
};
export const signOutController = (db) => async (req, res) => {
  await signOut(db, req.session);
  res.clearCookie('rr_session', {
    path: '/',
  });
  res.json({
    ok: true,
  });
};
