#!/usr/bin/env node

/**
 * Server Bootstrap
 * Handles application startup, database connection, and server lifecycle
 */

// Import configuration (must be first to validate env vars)
import connectDB from './config/database_config.js';
import { env } from './config/env_config.js';
import { logger } from './config/logger_config.js';
import { LOGGER_MESSAGES } from './constants/messages.js';

// Import Express app
import app from './app.js';

/**
 * Bootstrap Application
 */
async function startServer() {
  try {
    // Display configuration summary
    env.displayConfig();

    // Connect to database
    await connectDB();

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(
        `${LOGGER_MESSAGES.SERVER_RUNNING} ${env.PORT} in ${env.NODE_ENV} mode`
      );
      logger.info(`${LOGGER_MESSAGES.API_AVAILABLE} http://localhost:${env.PORT}/api`);
      logger.info(`${LOGGER_MESSAGES.HEALTH_CHECK} http://localhost:${env.PORT}/api/health`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} ${LOGGER_MESSAGES.GRACEFUL_SHUTDOWN}`);

      server.close(() => {
        logger.info(LOGGER_MESSAGES.HTTP_SERVER_CLOSED);

        // Close database connection
        import('mongoose').then((mongoose) => {
          mongoose.default.connection.close(() => {
            logger.info(LOGGER_MESSAGES.DATABASE_CONNECTION_CLOSED);
            process.exit(0);
          });
        });
      });
    };

    // Handle different termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error(LOGGER_MESSAGES.UNCAUGHT_EXCEPTION, error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(
        LOGGER_MESSAGES.UNHANDLED_REJECTION_AT,
        promise,
        LOGGER_MESSAGES.UNHANDLED_REJECTION_REASON,
        reason
      );
      process.exit(1);
    });
  } catch (error) {
    logger.error(LOGGER_MESSAGES.FAILED_TO_START_SERVER, error);
    process.exit(1);
  }
}

// Start the server
startServer();
