import { logger } from './utils/logger.js';
import { env } from './config/env.js';
import { openMongoDb } from './config/mongoDatabase.js';
import { mongoConnectionDiagnostics } from './config/mongoConnectionDiagnostics.js';
import { createApp } from './app.js';

async function startServer() {
  const database = await openMongoDb();
  const server = createApp(database).listen(env.PORT, env.HOST, () => {
    logger.info('server_ready', { host: env.HOST, port: env.PORT });
  });

  let shuttingDown = false;
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      if (shuttingDown) return;
      shuttingDown = true;
      logger.info('server_shutdown_started', { signal });

      const forceCloseTimer = setTimeout(() => {
        logger.error('server_shutdown_timeout', { signal });
        server.closeAllConnections();
      }, 25_000);
      forceCloseTimer.unref();

      server.close((error) => {
        clearTimeout(forceCloseTimer);
        if (error) logger.error('server_http_close_failed', { name: error.name });
        database
          .close()
          .then(() => {
            logger.info('server_shutdown_complete', { signal });
            if (error) process.exitCode = 1;
          })
          .catch((closeError) => {
            logger.error('database_close_failed', { name: closeError.name });
            process.exitCode = 1;
          });
      });
      server.closeIdleConnections();
    });
  }
}

startServer().catch((error) => {
  logger.error('mongo_startup_failed', mongoConnectionDiagnostics(error));
  process.exitCode = 1;
});
