import { Router } from 'express';
import { sensitiveLimiter } from '../../middleware/rateLimiter.js';
import { checkoutCatalog, quoteCheckout, reserveCheckout } from './checkout.service.js';
import { accessTablesInstalled, createCustomerAccessSession } from './customerAccess.service.js';
import { fail } from '../../utils/ApiError.js';

function setCustomerAccessCookie(res, session) {
  res.cookie('rr_customer_access', session.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: session.expiresAt - Date.now(),
    path: '/',
  });
}

export function createCheckoutRouter(db) {
  const router = Router();
  router.use('/api/checkout', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.get('/api/checkout/catalog', async (req, res) =>
    res.json(await checkoutCatalog(db, req.query)),
  );
  router.post('/api/checkout/quote', async (req, res) =>
    res.json(await quoteCheckout(db, req.body)),
  );
  router.post('/api/checkout/reserve', sensitiveLimiter, async (req, res) => {
    if (!(await accessTablesInstalled(db)))
      fail(
        503,
        'Customer verification is not installed. Apply migration 0008_customer_access_security.',
      );
    const result = await reserveCheckout(db, req.body);
    const first = result.bookings[0]?.booking;
    if (first) {
      const session = await createCustomerAccessSession(
        db,
        first.customer_id,
        result.bookings.map(({ booking }) => booking.id),
      );
      setCustomerAccessCookie(res, session);
    }
    res.status(201).json(result);
  });
  return router;
}
