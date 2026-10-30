import { Router } from 'express';
import {
  quoteBookingController,
  reserveWebsiteBookingController,
  lookupBookingController,
  getBookingController,
  cancelBookingController,
  rescheduleBookingController,
  listBookingsController,
  reserveManualBookingController,
} from './booking.controller.js';
import { sensitiveLimiter } from '../../middleware/rateLimiter.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { lookupBookingInput } from './booking.validation.js';
export function createBookingsRouter(db) {
  const router = Router();
  router.post('/api/quote', quoteBookingController(db));
  router.post('/api/bookings', sensitiveLimiter, reserveWebsiteBookingController(db));
  router.post(
    '/api/bookings/lookup',
    sensitiveLimiter,
    validateRequest(lookupBookingInput),
    lookupBookingController(db),
  );
  router.get('/api/bookings/:id', getBookingController(db));
  router.post('/api/bookings/:id/cancel', cancelBookingController(db));
  router.post('/api/bookings/:id/reschedule', rescheduleBookingController(db));
  router.get('/api/admin/bookings', listBookingsController(db));
  router.post('/api/admin/bookings', reserveManualBookingController(db));
  return router;
}
