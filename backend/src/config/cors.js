import { env, isProduction } from './env.js';

export const allowedOrigins = env.APP_ORIGIN.split(',').map((origin) => origin.trim());

function isLocalDevelopmentOrigin(origin) {
  if (isProduction) return false;

  try {
    const parsed = new URL(origin);
    return (
      parsed.protocol === 'http:' &&
      parsed.origin === origin &&
      ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
    );
  } catch {
    return false;
  }
}

export function isAllowedOrigin(origin, origins = allowedOrigins) {
  return (
    !origin ||
    origins.includes(origin) ||
    (!isProduction &&
      origins.some((allowed) => allowed.replace('localhost', '127.0.0.1') === origin)) ||
    isLocalDevelopmentOrigin(origin)
  );
}
