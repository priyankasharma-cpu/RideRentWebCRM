import { spawn } from 'node:child_process';
import { resolveProjectPath, projectRoot } from '../src/config/paths.js';

export function prismaCommand(args, databaseUrl = process.env.DATABASE_URL) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        resolveProjectPath('backend/node_modules/prisma/build/index.js'),
        ...args,
        '--config',
        resolveProjectPath('backend/prisma.config.ts'),
      ],
      {
        cwd: projectRoot,
        stdio: 'inherit',
        env: { ...process.env, ...(databaseUrl ? { DATABASE_URL: databaseUrl } : {}) },
      },
    );
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Prisma exited with code ${code}`)),
    );
  });
}
