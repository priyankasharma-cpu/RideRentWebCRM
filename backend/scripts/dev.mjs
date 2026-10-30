import { spawn } from 'node:child_process';
import { resolveProjectPath, projectRoot } from '../src/config/paths.js';

const processes = [
  spawn(process.execPath, ['--watch', resolveProjectPath('backend/src/server.js')], {
    cwd: projectRoot,
    stdio: 'inherit',
  }),
  spawn(
    process.execPath,
    [resolveProjectPath('frontend/node_modules/vite/bin/vite.js'), resolveProjectPath('frontend')],
    { cwd: projectRoot, stdio: 'inherit' },
  ),
];

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  processes.forEach((child) => child.kill());
  process.exitCode = code;
}
for (const child of processes) {
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code) => stop(code || 0));
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
