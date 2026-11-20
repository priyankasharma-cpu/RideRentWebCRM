import {
  collection,
  fromDocument,
  fromDocuments,
  mongoOptions,
} from '../../config/mongoDatabase.js';

export async function listUserRecords(db) {
  const users = await collection(db, 'users')
    .find(
      {},
      { ...mongoOptions(db), projection: { _id: 0, id: 1, name: 1, email: 1, role: 1, active: 1 } },
    )
    .sort({ name: 1 })
    .toArray();
  return fromDocuments(users);
}

export async function insertUser(db, id, name, email, passwordHash, role, active, createdAt) {
  return collection(db, 'users').insertOne(
    {
      _id: id,
      id,
      name,
      email,
      password_hash: passwordHash,
      role,
      active,
      created_at: createdAt,
    },
    mongoOptions(db),
  );
}

export async function findUserById(db, id) {
  return fromDocument(
    await collection(db, 'users').findOne(
      { id },
      { ...mongoOptions(db), projection: { _id: 0, id: 1 } },
    ),
  );
}

export async function updateUserByActiveAndId(db, active, id) {
  return collection(db, 'users').updateOne({ id }, { $set: { active } }, mongoOptions(db));
}

export async function deleteSessionByUserId(db, id) {
  return collection(db, 'sessions').deleteMany({ user_id: id }, mongoOptions(db));
}

export async function findUserByIdVariant2(db, id) {
  return fromDocument(await collection(db, 'users').findOne({ id }, mongoOptions(db)));
}

export async function updateUserByPasswordHashAndId(db, passwordHash, id) {
  return collection(db, 'users').updateOne(
    { id },
    { $set: { password_hash: passwordHash } },
    mongoOptions(db),
  );
}

export async function deleteSessionByUserIdVariant2(db, id, sessionId) {
  return collection(db, 'sessions').deleteMany(
    { user_id: id, id: { $ne: sessionId } },
    mongoOptions(db),
  );
}
