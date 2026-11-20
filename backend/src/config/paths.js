import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
export const frontendDist = resolve(projectRoot, 'frontend/dist');
export const resolveProjectPath = (value) => resolve(projectRoot, value);
