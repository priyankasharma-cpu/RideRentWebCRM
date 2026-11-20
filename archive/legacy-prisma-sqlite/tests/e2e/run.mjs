import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { createApp } from '../../src/app.js';
import { openDb } from '../../src/config/database.js';
import { seed } from '../../prisma/seed.js';
import { resolveProjectPath, projectRoot } from '../../src/config/paths.js';

// Browser tests never target the agency's configured database or running server.
const email = 'e2e@riderent.local';
const password = randomBytes(18).toString('base64url');
process.env.ADMIN_EMAIL = email;
process.env.ADMIN_PASSWORD = password;
mkdirSync(resolveProjectPath('backend/.artifacts/screenshots'), { recursive: true });
const database = await openDb(':memory:');
await seed(database);
const origins = [];
const server = createApp(database, { origins }).listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
origins.push(base);

try {
  const scenario = process.argv.includes('--layout') ? 'layout.mjs' : 'workflow.mjs';
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [resolveProjectPath(`backend/tests/e2e/${scenario}`)], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        TEST_BASE_URL: base,
        RIDERENT_E2E_MODE: 'isolated',
        ADMIN_EMAIL: email,
        ADMIN_PASSWORD: password,
      },
    });
    child.on('error', reject);
    child.on('exit', resolve);
  });
  process.exitCode = code || 0;
} finally {
  await new Promise((resolve) => server.close(resolve));
  await database.close();
}
