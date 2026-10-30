import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { sensitiveLimiter } from '../../middleware/rateLimiter.js';
import { loginSchema } from './auth.validation.js';
import { getSessionController, signInController, signOutController } from './auth.controller.js';
export function createAuthRouter(db) {
  const router = Router();
  router.get('/api/session', getSessionController(db));
  router.post('/api/login', sensitiveLimiter, validateRequest(loginSchema), signInController(db));
  router.post('/api/logout', signOutController(db));
  return router;
}
