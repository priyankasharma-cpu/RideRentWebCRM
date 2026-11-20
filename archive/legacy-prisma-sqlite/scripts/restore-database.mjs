import { resolveProjectPath } from '../src/config/paths.js';
import { createVerifiedSQLiteCopy } from './sqliteSnapshot.js';

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const backupPath = readArgument('--backup');
const destinationPath = readArgument('--output');
if (!backupPath || !destinationPath)
  throw new Error(
    'Usage: npm run db:restore -- --backup <verified-sqlite-backup> --output <new-restore-file>',
  );

const result = await createVerifiedSQLiteCopy(
  resolveProjectPath(backupPath),
  resolveProjectPath(destinationPath),
);
console.log(
  JSON.stringify(
    {
      restoredCopy: result.destination,
      sha256: result.sha256,
      tables: result.tableCount,
      status: 'verified; existing files were not overwritten',
      nextStep: 'Stop the backend and switch to this file only after reviewing the verification.',
    },
    null,
    2,
  ),
);
