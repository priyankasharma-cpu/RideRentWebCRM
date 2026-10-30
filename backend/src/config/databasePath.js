import { fileURLToPath } from 'node:url';
import { env } from './env.js';
import { resolveProjectPath } from './paths.js';

export function databasePath() {
  if (!env.DATABASE_URL) return resolveProjectPath(env.DB_PATH);
  if (/[?#]/.test(env.DATABASE_URL))
    throw new Error('Use a plain SQLite file URL without connection parameters.');
  const filename = env.DATABASE_URL.startsWith('file://')
    ? fileURLToPath(env.DATABASE_URL)
    : decodeURIComponent(env.DATABASE_URL.slice('file:'.length));
  if (!filename) throw new Error('DATABASE_URL must identify a SQLite database file.');
  return resolveProjectPath(filename);
}
