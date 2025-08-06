import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { env } from './index.js';

const logsDir = path.join(process.cwd(), 'logs');

if (env.NODE_ENV === 'development') {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFiles = ['error.log', 'combined.log'];
    logFiles.forEach(file => {
      const filePath = path.join(logsDir, file);
      if (fs.existsSync(filePath)) {
        fs.truncateSync(filePath, 0);
      }
    });

    console.log('🧹 Development mode: Log files cleared');
  } catch (error) {
    console.warn('⚠️  Warning: Could not clear log files:', error.message);
  }
}

const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'express-auth-api' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  );
}

export { logger };
