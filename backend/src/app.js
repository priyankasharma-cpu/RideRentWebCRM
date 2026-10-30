import { requestId } from './middleware/requestId.js';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { frontendDist } from './config/paths.js';
import { isProduction } from './config/env.js';
import { authenticate, requireStaff } from './middleware/authenticate.js';
import { csrfProtection } from './middleware/csrf.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { uploadedImages } from './modules/uploads/upload.static.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createSettingsRouter as moduleRouter0 } from './modules/settings/settings.routes.js';
import { createVehiclesRouter as moduleRouter1 } from './modules/vehicles/vehicle.routes.js';
import { createBookingsRouter as moduleRouter2 } from './modules/bookings/booking.routes.js';
import { createAnalyticsRouter as moduleRouter3 } from './modules/analytics/analytics.routes.js';
import { createUploadsRouter as moduleRouter4 } from './modules/uploads/upload.routes.js';
import { createRentalsRouter as moduleRouter5 } from './modules/rentals/rental.routes.js';
import { createPaymentsRouter as moduleRouter6 } from './modules/payments/payment.routes.js';
import { createCustomersRouter as moduleRouter7 } from './modules/customers/customer.routes.js';
import { createMaintenanceRouter as moduleRouter8 } from './modules/maintenance/maintenance.routes.js';
import { createAuthRouter as moduleRouter9 } from './modules/auth/staff.routes.js';
import { createAuditRouter as moduleRouter10 } from './modules/audit/audit.routes.js';
export function createApp(db, { origins } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestId);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'https:', 'data:'],
          connectSrc: ["'self'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    express.json({
      limit: '100kb',
    }),
  );
  app.use(cookieParser());
  app.use('/api', apiLimiter, authenticate(db), csrfProtection(origins));
  app.use('/api/admin', requireStaff, (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use('/api/bookings', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(createAuthRouter(db));
  app.use(moduleRouter0(db));
  app.use(moduleRouter1(db));
  app.use(moduleRouter2(db));
  app.use(moduleRouter3(db));
  app.use(moduleRouter4(db));
  app.use(moduleRouter5(db));
  app.use(moduleRouter6(db));
  app.use(moduleRouter7(db));
  app.use(moduleRouter8(db));
  app.use(moduleRouter9(db));
  app.use(moduleRouter10(db));
  app.use('/api', (_req, res) =>
    res.status(404).json({
      error: 'API route not found.',
    }),
  );
  app.use('/images/uploads', uploadedImages);
  app.use(express.static(frontendDist));
  app.get('/{*path}', (_req, res) => res.sendFile(frontendDist + '/index.html'));
  app.use(errorHandler);
  return app;
}
