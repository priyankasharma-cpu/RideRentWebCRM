import { resolveProjectPath } from '../src/config/paths.js';
import { createVerifiedSQLiteCopy } from './sqliteSnapshot.js';

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const sourcePath = readArgument('--database');
const destinationPath = readArgument('--output');
if (!sourcePath || !destinationPath)
  throw new Error(
    'Usage: npm run db:backup -- --database <existing-sqlite-file> --output <new-backup-file>',
  );

const result = await createVerifiedSQLiteCopy(
  resolveProjectPath(sourcePath),
  resolveProjectPath(destinationPath),
);
console.log(
  JSON.stringify(
    {
      backup: result.destination,
      sha256: result.sha256,
      tables: result.tableCount,
      status: 'verified; source remained read-only',
    },
    null,
    2,
  ),
);
