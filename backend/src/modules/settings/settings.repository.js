import { run, get } from '../../config/database.js';
export async function updateShopSettingsByData(db, value1) {
  return await run(db, 'UPDATE settings SET data=? WHERE id=1', value1);
}
export async function findShopSettings(db) {
  return await get(db, 'SELECT data FROM settings WHERE id=1');
}
