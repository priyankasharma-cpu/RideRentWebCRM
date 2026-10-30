import { Router } from 'express';
import {
  listPublicVehiclesController,
  getPublicVehicleController,
  listManagedVehiclesController,
  addVehicleController,
  editVehicleController,
} from './vehicle.controller.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { addVehicleInput, editVehicleInput } from './vehicle.validation.js';
export function createVehiclesRouter(db) {
  const router = Router();
  router.get('/api/vehicles', listPublicVehiclesController(db));
  router.get('/api/vehicles/:slug', getPublicVehicleController(db));
  router.get('/api/admin/vehicles', listManagedVehiclesController(db));
  router.post(
    '/api/admin/vehicles',
    authorize('admin'),
    validateRequest(addVehicleInput),
    addVehicleController(db),
  );
  router.put(
    '/api/admin/vehicles/:id',
    authorize('admin'),
    validateRequest(editVehicleInput),
    editVehicleController(db),
  );
  return router;
}
