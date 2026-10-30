import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolveProjectPath } from '../src/config/paths.js';
import { prismaCommand } from './prisma.mjs';

const envPath = resolveProjectPath('backend/.env');
if (!existsSync(envPath)) {
  const password = `Ride-${randomBytes(12).toString('base64url')}!`;
  writeFileSync(
    envPath,
    `ADMIN_EMAIL=admin@riderent.local\nADMIN_PASSWORD=${password}\nDB_PATH=backend/data/riderent.sqlite\nPORT=3001\nAPP_ORIGIN=http://localhost:5173,http://localhost:3001\n`,
  );
  console.log('Created backend/.env with a random local administrator password.');
}
process.loadEnvFile(envPath);
await prismaCommand(['generate']);
const { databasePath } = await import('../src/config/databasePath.js');
const file = databasePath();
if (existsSync(file)) {
  console.log(
    'Existing database preserved. No migrations, backfill or seed were applied. See docs/deployment.md for explicit baselining.',
  );
} else {
  await prismaCommand(['migrate', 'deploy']);
  const { openDb } = await import('../src/config/database.js');
  const { seed } = await import('../prisma/seed.js');
  const database = await openDb(file);
  try {
    await seed(database);
  } finally {
    await database.close();
  }
  console.log('Fresh local demo database created. Credentials are in backend/.env.');
}
