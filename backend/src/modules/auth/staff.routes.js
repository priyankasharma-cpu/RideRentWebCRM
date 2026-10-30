import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import {
  listStaffController,
  addStaffController,
  changeStaffAccessController,
  changePasswordController,
} from './staff.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { addStaffInput, changeStaffAccessInput, changePasswordInput } from './staff.validation.js';
export function createAuthRouter(db) {
  const router = Router();
  router.get('/api/admin/staff', authorize('admin'), listStaffController(db));
  router.post(
    '/api/admin/staff',
    authorize('admin'),
    validateRequest(addStaffInput),
    addStaffController(db),
  );
  router.patch(
    '/api/admin/staff/:id',
    authorize('admin'),
    validateRequest(changeStaffAccessInput),
    changeStaffAccessController(db),
  );
  router.post(
    '/api/admin/change-password',
    validateRequest(changePasswordInput),
    changePasswordController(db),
  );
  return router;
}
