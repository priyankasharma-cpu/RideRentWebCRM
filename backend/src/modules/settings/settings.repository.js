import { collection, fromDocument, mongoOptions } from '../../config/mongoDatabase.js';

export async function updateShopSettingsByData(db, data) {
  return collection(db, 'settings').updateOne({ id: 1 }, { $set: { data } }, mongoOptions(db));
}

export async function findShopSettings(db) {
  return fromDocument(await collection(db, 'settings').findOne({ id: 1 }, mongoOptions(db)));
}
