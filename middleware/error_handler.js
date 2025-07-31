import { env } from '../config/env_config.js';
import { logger } from '../config/logger_config.js';
import { ERROR_MESSAGES } from '../constants/index.js';

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = ERROR_MESSAGES.RESOURCE_NOT_FOUND;
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${
      field.charAt(0).toUpperCase() + field.slice(1)
    } already exists`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = ERROR_MESSAGES.JWT_INVALID;
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = ERROR_MESSAGES.TOKEN_EXPIRED;
    error = new AppError(message, 401);
  }

  // Rate limit error
  if (err.status === 429) {
    const message = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
    error = new AppError(message, 429);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || ERROR_MESSAGES.SERVER_ERROR,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
