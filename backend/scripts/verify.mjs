import { spawn } from 'node:child_process';
import { projectRoot } from '../src/config/paths.js';

const stages = ['format:check', 'lint', 'test', 'build', 'test:ui', 'test:layout'];
for (const stage of stages) {
  console.log(`\nChecking ${stage}…`);
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [process.env.npm_execpath, 'run', stage], {
      cwd: projectRoot,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', resolve);
  });
  if (result !== 0) {
    process.exitCode = result || 1;
    break;
  }
}
