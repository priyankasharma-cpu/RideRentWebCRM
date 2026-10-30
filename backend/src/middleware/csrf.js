import { allowedOrigins, isAllowedOrigin } from '../config/cors.js';
export function csrfProtection(origins = allowedOrigins) {
  return (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    const allowed = isAllowedOrigin(origin, origins);
    if (!allowed)
      return res.status(403).json({
        error: 'Request origin is not allowed.',
      });
    if (!req.session || req.get('x-csrf-token') !== req.session.csrf) {
      return res.status(403).json({
        error: 'Session expired. Refresh and try again.',
      });
    }
    next();
  };
}
