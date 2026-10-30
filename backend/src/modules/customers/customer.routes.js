import { Router } from 'express';
import { listCustomersController, verifyCustomerController } from './customer.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { verifyCustomerInput } from './customer.validation.js';
export function createCustomersRouter(db) {
  const router = Router();
  router.get('/api/admin/customers', listCustomersController(db));
  router.patch(
    '/api/admin/customers/:id',
    validateRequest(verifyCustomerInput),
    verifyCustomerController(db),
  );
  return router;
}
