import { MongoClient } from 'mongodb';
import { env } from '../src/config/env.js';
import { configureMongoDns } from '../src/config/mongoDns.js';
import { mongoConnectionDiagnostics } from '../src/config/mongoConnectionDiagnostics.js';

if (!env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required. Add it to backend/.env or your process environment.');
}

configureMongoDns();
const client = new MongoClient(env.MONGODB_URI, {
  appName: 'RideRent-connection-check',
  tls: true,
  serverSelectionTimeoutMS: 10_000,
});
try {
  await client.connect();
  await client.db(env.MONGODB_DB_NAME).command({ ping: 1 });
  console.log(`MongoDB connection ready for database "${env.MONGODB_DB_NAME}".`);
} catch (error) {
  console.error(
    JSON.stringify({
      level: 'error',
      event: 'mongodb_check_failed',
      ...mongoConnectionDiagnostics(error),
    }),
  );
  process.exitCode = 1;
} finally {
  await client.close().catch(() => {});
}
