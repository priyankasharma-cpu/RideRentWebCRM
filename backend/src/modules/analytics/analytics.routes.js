import { Router } from 'express';
import { getDashboardController } from './analytics.controller.js';
export function createAnalyticsRouter(db) {
  const router = Router();
  router.get('/api/admin/dashboard', getDashboardController(db));
  return router;
}
