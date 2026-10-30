import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { recordPaymentInput, refundPaymentInput } from './payment.validation.js';
import {
  recordPaymentController,
  refundPaymentController,
  listPaymentsController,
} from './payment.controller.js';
import { authorize } from '../../middleware/authorize.js';
export function createPaymentsRouter(db) {
  const router = Router();
  router.post(
    '/api/admin/bookings/:id/payments',
    validateRequest(recordPaymentInput),
    recordPaymentController(db),
  );
  router.post(
    '/api/admin/payments/:id/refund',
    authorize('admin'),
    validateRequest(refundPaymentInput),
    refundPaymentController(db),
  );
  router.get('/api/admin/payments', listPaymentsController(db));
  return router;
}
