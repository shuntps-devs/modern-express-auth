import mongoose from 'mongoose';
import { LOGGER_MESSAGES } from '../constants/index.js';
import { env, logger } from './index.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);

    logger.info(`${LOGGER_MESSAGES.DATABASE_CONNECTION_SUCCESS} ${conn.connection.host}`);
  } catch (error) {
    logger.error(LOGGER_MESSAGES.DATABASE_CONNECTION_ERROR, error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('error', err => {
  logger.error(LOGGER_MESSAGES.MONGOOSE_CONNECTION_ERROR, err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn(LOGGER_MESSAGES.MONGOOSE_DISCONNECTED);
});

export default connectDB;
