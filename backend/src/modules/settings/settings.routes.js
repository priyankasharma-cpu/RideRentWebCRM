import { Router } from 'express';
import { getShopSettingsController, updateShopSettingsController } from './settings.controller.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { updateShopSettingsInput } from './settings.validation.js';
export function createSettingsRouter(db) {
  const router = Router();
  router.get('/api/settings', getShopSettingsController(db));
  router.put(
    '/api/admin/settings',
    authorize('admin'),
    validateRequest(updateShopSettingsInput),
    updateShopSettingsController(db),
  );
  return router;
}
