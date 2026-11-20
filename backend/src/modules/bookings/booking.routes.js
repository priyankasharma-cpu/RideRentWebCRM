import { Router } from 'express';
import {
  quoteBookingController,
  reserveWebsiteBookingController,
  requestBookingOtpController,
  verifyBookingOtpController,
  getBookingController,
  cancelBookingController,
  rescheduleBookingController,
  listBookingsController,
  reserveManualBookingController,
} from './booking.controller.js';
import { sensitiveLimiter } from '../../middleware/rateLimiter.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requestBookingOtpInput, verifyBookingOtpInput } from './booking.validation.js';
import { rateLimit } from 'express-rate-limit';
export function createBookingsRouter(db, { otpDelivery } = {}) {
  const router = Router();
  const otpRequestLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many verification requests. Please try again later.' },
  });
  const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many verification attempts. Please request a new code later.' },
  });
  router.post('/api/quote', quoteBookingController(db));
  router.post('/api/bookings', sensitiveLimiter, reserveWebsiteBookingController(db));
  router.post(
    '/api/bookings/access/request',
    otpRequestLimiter,
    validateRequest(requestBookingOtpInput),
    requestBookingOtpController(db, otpDelivery ? { deliver: otpDelivery } : undefined),
  );
  router.post('/api/bookings/lookup', sensitiveLimiter, (_req, res) =>
    res.status(410).json({ error: 'Booking access now requires email verification.' }),
  );
  router.post(
    '/api/bookings/access/verify',
    otpVerifyLimiter,
    validateRequest(verifyBookingOtpInput),
    verifyBookingOtpController(db),
  );
  router.get('/api/bookings/:id', getBookingController(db));
  router.post('/api/bookings/:id/cancel', cancelBookingController(db));
  router.post('/api/bookings/:id/reschedule', rescheduleBookingController(db));
  router.get('/api/admin/bookings', listBookingsController(db));
  router.post('/api/admin/bookings', reserveManualBookingController(db));
  return router;
}
