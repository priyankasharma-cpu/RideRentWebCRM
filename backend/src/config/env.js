import { existsSync } from 'node:fs';
import { z } from 'zod';
import { resolveProjectPath } from './paths.js';
const file = resolveProjectPath('backend/.env');
if (existsSync(file)) process.loadEnvFile(file);
export const env = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    HOST: z.string().default('127.0.0.1'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DB_PATH: z.string().min(1).default('backend/data/riderent.sqlite'),
    DATABASE_URL: z.string().startsWith('file:').optional(),
    APP_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3001'),
  })
  .parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
