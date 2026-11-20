import { existsSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { z } from 'zod';
import { resolveProjectPath } from './paths.js';
const file = resolveProjectPath('backend/.env');
if (existsSync(file)) process.loadEnvFile(file);
export const env = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    HOST: z.string().default('0.0.0.0'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    MONGODB_URI: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().startsWith('mongodb').optional(),
    ),
    MONGODB_DB_NAME: z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/)
      .default('riderent_rehearsal'),
    MONGODB_DNS_SERVERS: z.string().default(''),
    APP_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3001'),
    UPLOAD_DIR: z.string().min(1).default('backend/uploads'),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
    OTP_HASH_SECRET: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().min(32).optional(),
    ),
    RESEND_API_KEY: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().min(1).optional(),
    ),
    OTP_FROM_EMAIL: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().email().optional(),
    ),
  })
  .parse(process.env);
export const isProduction = env.NODE_ENV === 'production';

if (isProduction) {
  if (env.HOST !== '0.0.0.0')
    throw new Error('Production HOST must be 0.0.0.0 for the public service proxy.');

  const origins = env.APP_ORIGIN.split(',').map((origin) => origin.trim());
  if (
    origins.length === 0 ||
    origins.some((origin) => {
      try {
        const parsed = new URL(origin);
        return parsed.protocol !== 'https:' || parsed.origin !== origin;
      } catch {
        return true;
      }
    })
  ) {
    throw new Error('Production APP_ORIGIN must contain exact HTTPS website origins.');
  }

  if (!env.MONGODB_URI) throw new Error('MONGODB_URI is required for the production database.');
  if (!process.env.MONGODB_DB_NAME)
    throw new Error('MONGODB_DB_NAME must be explicitly set for the production database.');
  if (!isAbsolute(env.UPLOAD_DIR))
    throw new Error('Production UPLOAD_DIR must be absolute and point to persistent storage.');
  if (env.TRUST_PROXY_HOPS < 1)
    throw new Error('Set TRUST_PROXY_HOPS to the number of trusted production proxy hops.');
}
