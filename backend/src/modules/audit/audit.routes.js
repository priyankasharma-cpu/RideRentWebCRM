import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import { listAuditController } from './audit.controller.js';
export function createAuditRouter(db) {
  const router = Router();
  router.get('/api/admin/audit', authorize('admin'), listAuditController(db));
  return router;
}
