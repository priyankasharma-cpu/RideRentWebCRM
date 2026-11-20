import { env } from './env.js';
import { resolveProjectPath } from './paths.js';

export const uploadDirectory = resolveProjectPath(env.UPLOAD_DIR);
