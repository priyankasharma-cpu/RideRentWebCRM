import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import { vehicleUpload } from './upload.middleware.js';
import { uploadVehicleImageController } from './upload.controller.js';
export function createUploadsRouter(db) {
  const router = Router();
  router.post(
    '/api/admin/uploads',
    authorize('admin'),
    vehicleUpload.single('image'),
    uploadVehicleImageController(db),
  );
  return router;
}
