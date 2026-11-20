import { collection, fromDocument, mongoOptions } from '../../config/mongoDatabase.js';

export async function findSession(db, tokenHash, time) {
  return fromDocument(
    await collection(db, 'sessions').findOne(
      { id: tokenHash, expires_at: { $gt: time } },
      mongoOptions(db),
    ),
  );
}

export async function findSessionUser(db, userId) {
  return fromDocument(
    await collection(db, 'users').findOne(
      { id: userId, active: 1 },
      { ...mongoOptions(db), projection: { _id: 0, id: 1, name: 1, email: 1, role: 1 } },
    ),
  );
}

export async function insertSession(db, tokenHash, userId, csrf, expiresAt) {
  return collection(db, 'sessions').insertOne(
    { _id: tokenHash, id: tokenHash, user_id: userId, csrf, expires_at: expiresAt },
    mongoOptions(db),
  );
}

export async function removeExpiredSessions(db, time) {
  return collection(db, 'sessions').deleteMany({ expires_at: { $lt: time } }, mongoOptions(db));
}

export async function removeSession(db, tokenHash) {
  return collection(db, 'sessions').deleteOne({ id: tokenHash }, mongoOptions(db));
}

export async function findLoginUser(db, email) {
  return fromDocument(
    await collection(db, 'users').findOne({ email, active: 1 }, mongoOptions(db)),
  );
}
