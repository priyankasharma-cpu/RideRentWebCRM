import { all, get, run } from '../../config/database.js';

export const addOnsInstalled = async (db) =>
  Boolean(await get(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='addons'"));
export async function listAddOns(db) {
  if (!(await addOnsInstalled(db))) return [];
  const [records, categories] = await Promise.all([
    all(db, 'SELECT * FROM addons ORDER BY name,id'),
    all(db, 'SELECT * FROM addon_categories ORDER BY category'),
  ]);
  return records.map((row) => ({
    ...row,
    enabled: Boolean(row.enabled),
    maxQuantity: row.max_quantity,
    categories: categories
      .filter((rule) => rule.addon_id === row.id)
      .map((rule) => ({ category: rule.category, includedQuantity: rule.included_quantity })),
  }));
}
export const findAddOn = async (db, id) => (await listAddOns(db)).find((row) => row.id === id);
export const findAddOnCode = async (db, code) =>
  (await listAddOns(db)).find((row) => row.code === code);
export const insertAddOn = (db, row) =>
  run(
    db,
    'INSERT INTO addons(id,code,name,description,image,rate,billing,stock,unserviceable,max_quantity,enabled,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    row.id,
    row.code,
    row.name,
    row.description,
    row.image,
    row.rate,
    row.billing,
    row.stock,
    row.unserviceable,
    row.maxQuantity,
    row.enabled ? 1 : 0,
    1,
    row.createdAt,
    row.createdAt,
  );
export const updateAddOn = (db, id, row) =>
  run(
    db,
    'UPDATE addons SET name=?,description=?,image=?,rate=?,billing=?,stock=?,unserviceable=?,max_quantity=?,enabled=?,version=version+1,updated_at=? WHERE id=?',
    row.name,
    row.description,
    row.image,
    row.rate,
    row.billing,
    row.stock,
    row.unserviceable,
    row.maxQuantity,
    row.enabled ? 1 : 0,
    row.updatedAt,
    id,
  );
export async function replaceCategories(db, id, categories) {
  await run(db, 'DELETE FROM addon_categories WHERE addon_id=?', id);
  for (const rule of categories)
    await run(
      db,
      'INSERT INTO addon_categories(addon_id,category,included_quantity) VALUES(?,?,?)',
      id,
      rule.category,
      rule.includedQuantity,
    );
}
export const archiveAddOn = (db, id, time) =>
  run(
    db,
    'UPDATE addons SET archived_at=?,enabled=0,version=version+1,updated_at=? WHERE id=?',
    time,
    time,
    id,
  );
export async function allocationWindows(db, addon) {
  const rows = await all(
    db,
    "SELECT a.quantity,b.status,b.starts_at,b.ends_at FROM addon_allocations a JOIN bookings b ON b.id=a.booking_id WHERE a.addon_id=? AND b.status IN ('confirmed','active','inspecting')",
    addon.id,
  );
  if (
    addon.code === 'helmet' &&
    (await get(db, "SELECT name FROM sqlite_master WHERE name='booking_addons'"))
  ) {
    rows.push(
      ...(await all(
        db,
        "SELECT a.quantity,b.status,b.starts_at,b.ends_at FROM booking_addons a JOIN bookings b ON b.id=a.booking_id WHERE b.status IN ('confirmed','active','inspecting')",
      )),
    );
  }
  return rows;
}
export const insertAllocation = (db, row) =>
  run(
    db,
    'INSERT INTO addon_allocations(id,addon_id,booking_id,quantity,included_quantity,name,rate,billing,base,tax,version) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
    row.id,
    row.addonId,
    row.bookingId,
    row.quantity,
    row.includedQuantity,
    row.name,
    row.rate,
    row.billing,
    row.base,
    row.tax,
    row.version,
  );
export const listAllocationSnapshots = async (db) =>
  (await addOnsInstalled(db))
    ? all(db, 'SELECT a.*,d.code FROM addon_allocations a JOIN addons d ON d.id=a.addon_id')
    : [];
