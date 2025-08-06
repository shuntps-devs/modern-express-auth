import mongoose from 'mongoose';
import { env, logger } from './index.js';

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      logger.info('Database already connected, skipping connection');
      return mongoose.connection;
    }

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(env.MONGODB_URI, options);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📊 Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    logger.error('❌ Database connection error:', error);

    if (env.NODE_ENV !== 'test') {
      logger.error('💀 Exiting process due to database connection failure');
      process.exit(1);
    } else {
      throw error;
    }
  }
};

mongoose.connection.on('connected', () => {
  logger.info('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', err => {
  logger.error('🚨 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️  Mongoose disconnected from MongoDB');

  if (env.NODE_ENV === 'production') {
    logger.info('🔄 Attempting to reconnect to MongoDB in 5 seconds...');
    setTimeout(() => {
      connectDB().catch(err => {
        logger.error('🚨 Reconnection failed:', err);
      });
    }, 5000);
  }
});

mongoose.connection.on('reconnected', () => {
  logger.info('🔄 Mongoose reconnected to MongoDB');
});

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
