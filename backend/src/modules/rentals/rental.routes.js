import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { pickUpRentalInput, returnRentalInput, completeRentalInput } from './rental.validation.js';
import {
  pickUpRentalController,
  returnRentalController,
  completeRentalController,
} from './rental.controller.js';
export function createRentalsRouter(db) {
  const router = Router();
  router.post(
    '/api/admin/bookings/:id/pickup',
    validateRequest(pickUpRentalInput),
    pickUpRentalController(db),
  );
  router.post(
    '/api/admin/bookings/:id/return',
    validateRequest(returnRentalInput),
    returnRentalController(db),
  );
  router.post(
    '/api/admin/bookings/:id/complete',
    validateRequest(completeRentalInput),
    completeRentalController(db),
  );
  return router;
}
