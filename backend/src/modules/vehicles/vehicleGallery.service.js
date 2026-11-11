import { transaction } from '../../config/database.js';
import { findVehicleById } from './vehicle.repository.js';
import { galleryInstalled, replaceVehicleImages } from './vehicleGallery.repository.js';
import { vehicleView } from './vehicle.presenter.js';
import { audit } from '../audit/audit.service.js';
import { fail } from '../../utils/ApiError.js';
export async function updateVehicleGallery(db, vehicleId, images, userId) {
  if (!(await galleryInstalled(db)))
    fail(503, 'Deploy the vehicle gallery database migration before editing photos.');
  await transaction(db, async () => {
    if (!(await findVehicleById(db, vehicleId))) fail(404, 'Vehicle not found.');
    await replaceVehicleImages(db, vehicleId, images);
    await audit(db, userId, 'vehicle.images.updated', vehicleId);
  });
  return vehicleView(db, await findVehicleById(db, vehicleId));
}
