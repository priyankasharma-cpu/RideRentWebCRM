import { Router } from 'express';
import {
  listMaintenanceController,
  scheduleMaintenanceController,
  resolveMaintenanceController,
} from './maintenance.controller.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { scheduleMaintenanceInput } from './maintenance.validation.js';
export function createMaintenanceRouter(db) {
  const router = Router();
  router.get('/api/admin/maintenance', listMaintenanceController(db));
  router.post(
    '/api/admin/maintenance',
    authorize('admin'),
    validateRequest(scheduleMaintenanceInput),
    scheduleMaintenanceController(db),
  );
  router.post(
    '/api/admin/maintenance/:id/resolve',
    authorize('admin'),
    resolveMaintenanceController(db),
  );
  return router;
}
