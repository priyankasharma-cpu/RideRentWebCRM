import { logger } from './utils/logger.js';
import { env } from './config/env.js';
import { openDb } from './config/database.js';
import { createApp } from './app.js';
const database = await openDb();
const server = createApp(database).listen(env.PORT, env.HOST, () => {
  logger.info('server_ready', { url: `http://${env.HOST}:${env.PORT}` });
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () =>
    server.close(async () => {
      await database.close();
      process.exit(0);
    }),
  );
}
