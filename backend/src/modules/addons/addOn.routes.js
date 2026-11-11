import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { addOnInput, updateAddOnInput, archiveAddOnInput } from './addOn.validation.js';
import {
  listAddOnsController,
  createAddOnController,
  editAddOnController,
  archiveAddOnController,
} from './addOn.controller.js';

export function createAddOnsRouter(db) {
  const router = Router();
  router.use('/api/admin/addons', authorize('admin'));
  router.get('/api/admin/addons', listAddOnsController(db));
  router.post('/api/admin/addons', validateRequest(addOnInput), createAddOnController(db));
  router.put('/api/admin/addons/:id', validateRequest(updateAddOnInput), editAddOnController(db));
  router.post(
    '/api/admin/addons/:id/archive',
    validateRequest(archiveAddOnInput),
    archiveAddOnController(db),
  );
  return router;
}
