import mongoose from 'mongoose';
import { LOGGER_MESSAGES } from '../constants/index.js';
import { env, logger } from './index.js';

const connectDB = async () => {
  try {
    // Check if already connected to avoid multiple connections
    if (mongoose.connection.readyState === 1) {
      logger.info('Database already connected, skipping connection');
      return;
    }

    const conn = await mongoose.connect(env.MONGODB_URI);

    logger.info(`${LOGGER_MESSAGES.DATABASE_CONNECTION_SUCCESS} ${conn.connection.host}`);
  } catch (error) {
    logger.error(LOGGER_MESSAGES.DATABASE_CONNECTION_ERROR, error);

    // Don't exit process in test environment
    if (env.NODE_ENV !== 'test') {
      process.exit(1);
    } else {
      // In test mode, throw the error instead of exiting
      throw error;
    }
  }
};

// Handle connection events
mongoose.connection.on('error', err => {
  logger.error(LOGGER_MESSAGES.MONGOOSE_CONNECTION_ERROR, err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn(LOGGER_MESSAGES.MONGOOSE_DISCONNECTED);
});

// Disconnect from database
export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('Database disconnected successfully');
    }
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
    throw error;
  }
};

export default connectDB;
