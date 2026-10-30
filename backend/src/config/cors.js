import { env, isProduction } from './env.js';

export const allowedOrigins = env.APP_ORIGIN.split(',').map((origin) => origin.trim());

export function isAllowedOrigin(origin, origins = allowedOrigins) {
  return (
    !origin ||
    origins.some(
      (allowed) =>
        allowed === origin ||
        (!isProduction && allowed.replace('localhost', '127.0.0.1') === origin),
    )
  );
}
