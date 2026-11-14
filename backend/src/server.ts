import { app } from './app';
import { config } from './config/environment';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';

async function bootstrap() {
  await connectDatabase();

  const server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`OpsRadar backend service running on http://0.0.0.0:${config.port} in [${config.env}] mode`);
  });

  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start OpsRadar server', err);
  process.exit(1);
});

