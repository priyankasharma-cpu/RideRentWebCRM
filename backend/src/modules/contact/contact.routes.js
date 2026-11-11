import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authorize } from '../../middleware/authorize.js';
import { contactInput, inquiryListInput, inquiryStatusInput } from './contact.validation.js';
import {
  createContactController,
  listContactController,
  updateContactController,
} from './contact.controller.js';
export function createContactRouter(db) {
  const router = Router();
  const submissionLimit = rateLimit({
    windowMs: 15 * 60000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many messages. Please try again in 15 minutes or call the shop.' },
  });
  router.post(
    '/api/contact',
    submissionLimit,
    validateRequest(contactInput),
    createContactController(db),
  );
  router.get(
    '/api/admin/inquiries',
    authorize('admin'),
    validateRequest(inquiryListInput, 'query'),
    listContactController(db),
  );
  router.patch(
    '/api/admin/inquiries/:id',
    authorize('admin'),
    validateRequest(inquiryStatusInput),
    updateContactController(db),
  );
  return router;
}
