#!/usr/bin/env node

import connectDB from './config/database_config.js';
import { env } from './config/env_config.js';
import { logger } from './config/logger_config.js';

import app from './app.js';

async function startServer() {
  try {
    env.displayConfig();
    await connectDB();

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`📡 API available at: http://localhost:${env.PORT}/api`);
      logger.info(`🏥 Health check: http://localhost:${env.PORT}/api/health`);
    });

    const gracefulShutdown = signal => {
      logger.info(`${signal} received, shutting down gracefully`);

      server.close(() => {
        logger.info('HTTP server closed');

        import('mongoose').then(mongoose => {
          mongoose.default.connection.close(() => {
            logger.info('Database connection closed');
            process.exit(0);
          });
        });
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', error => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
