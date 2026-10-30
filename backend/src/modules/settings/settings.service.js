import { updateShopSettingsByData, findShopSettings } from './settings.repository.js';
import { audit } from '../audit/audit.service.js';
export async function getShopSettings(db, _request) {
  return await settings(db);
}
export async function updateShopSettings(db, request) {
  const s = request.body;
  await updateShopSettingsByData(db, JSON.stringify(s));
  await audit(db, request.user.id, 'settings.updated', '1');
  return s;
}
export const settings = async (db) => JSON.parse((await findShopSettings(db)).data);
