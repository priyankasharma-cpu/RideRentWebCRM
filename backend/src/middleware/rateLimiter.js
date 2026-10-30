import { rateLimit } from 'express-rate-limit';
const WINDOW_MS = 15 * 60_000;
const options = {
  windowMs: WINDOW_MS,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
};
export const apiLimiter = rateLimit({
  ...options,
  limit: 600,
});
export const sensitiveLimiter = rateLimit({
  ...options,
  limit: 30,
  message: {
    error: 'Too many attempts. Please try again later.',
  },
});
