import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { env } from './env_config.js';
import { CONSOLE_MESSAGES } from '../constants/messages.js';

// Get directory path - compatible with both Node.js and Jest
const __dirname = `${process.cwd()}/config`;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');

// Clear log files in development mode for fresh logs on each restart
if (env.NODE_ENV === 'development') {
  try {
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Clear log files by truncating them
    const errorLogPath = path.join(logsDir, 'error.log');
    const combinedLogPath = path.join(logsDir, 'combined.log');

    if (fs.existsSync(errorLogPath)) {
      fs.truncateSync(errorLogPath, 0);
    }
    if (fs.existsSync(combinedLogPath)) {
      fs.truncateSync(combinedLogPath, 0);
    }

    // eslint-disable-next-line no-console
    console.log(CONSOLE_MESSAGES.DEV_MODE_LOGS_CLEARED);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(CONSOLE_MESSAGES.LOG_FILES_CLEAR_WARNING, error.message);
  }
}

const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'express-auth-api' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  );
}

export { logger };
