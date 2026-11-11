import { all, get, run } from '../../config/database.js';
export const galleryInstalled = async (db) =>
  Boolean(
    await get(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='vehicle_images'"),
  );
export async function listVehicleImages(db) {
  // Existing databases remain readable until the additive migration is deployed.
  return (await galleryInstalled(db))
    ? all(db, 'SELECT vehicle_id,id,label,url FROM vehicle_images ORDER BY vehicle_id,position')
    : [];
}
export async function replaceVehicleImages(db, vehicleId, images) {
  await run(db, 'DELETE FROM vehicle_images WHERE vehicle_id=?', vehicleId);
  for (const [position, image] of images.entries()) {
    await run(
      db,
      'INSERT INTO vehicle_images(vehicle_id,id,label,url,position) VALUES(?,?,?,?,?)',
      vehicleId,
      image.id,
      image.label,
      image.url,
      position,
    );
  }
  if (images.length)
    await run(db, 'UPDATE vehicles SET image=? WHERE id=?', images[0].url, vehicleId);
}
