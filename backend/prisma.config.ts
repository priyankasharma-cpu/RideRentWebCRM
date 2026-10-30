import { defineConfig } from 'prisma/config';
import { resolveProjectPath } from './src/config/paths.js';
import { databasePath } from './src/config/databasePath.js';
export default defineConfig({
  schema: resolveProjectPath('backend/prisma/schema.prisma'),
  migrations: { path: resolveProjectPath('backend/prisma/migrations') },
  datasource: { url: 'file:' + databasePath().replaceAll('\\', '/') },
});
