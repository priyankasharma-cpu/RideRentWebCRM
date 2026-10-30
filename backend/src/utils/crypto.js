import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const deriveKey = promisify(scrypt);
export const id = () => randomUUID();
export const hash = (value) => createHash('sha256').update(value).digest('hex');
export async function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}
export async function passwordMatches(password, stored) {
  const [salt, encoded] = String(stored).split(':');
  if (!salt || !/^[a-f0-9]{128}$/i.test(encoded || '')) return false;
  const candidate = await deriveKey(password, salt, 64);
  return timingSafeEqual(candidate, Buffer.from(encoded, 'hex'));
}
