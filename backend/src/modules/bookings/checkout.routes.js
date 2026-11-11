import { Router } from 'express';
import { sensitiveLimiter } from '../../middleware/rateLimiter.js';
import { checkoutCatalog, quoteCheckout, reserveCheckout } from './checkout.service.js';

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
  router.post('/api/checkout/reserve', sensitiveLimiter, async (req, res) =>
    res.status(201).json(await reserveCheckout(db, req.body)),
  );
  return router;
}
