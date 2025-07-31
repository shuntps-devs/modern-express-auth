import rateLimit from 'express-rate-limit';
import { env } from '../config/env_config.js';
import { logger } from '../config/logger_config.js';
import { ERROR_MESSAGES, CONSOLE_MESSAGES, LOGGER_MESSAGES, RATE_LIMIT_TYPES, RATE_LIMIT_DESCRIPTIONS } from '../constants/messages.js';

/**
 * Centralized Rate Limiting Configuration
 * Provides different rate limiting strategies for different endpoints
 */

// Default rate limiter for general API endpoints
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutes by default
  max: env.RATE_LIMIT_MAX_REQUESTS, // 100 requests by default
  message: {
    success: false,
    error: {
      message: ERROR_MESSAGES.RATE_LIMIT_IP,
      type: RATE_LIMIT_TYPES.GENERAL,
      retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000) // in seconds
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn(`${LOGGER_MESSAGES.RATE_LIMIT_EXCEEDED_IP} ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting in test environment
    return env.isTest;
  }
});

// Strict rate limiter for authentication endpoints (login, register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth endpoints
  message: {
    success: false,
    error: {
      message: ERROR_MESSAGES.RATE_LIMIT_AUTH,
      type: RATE_LIMIT_TYPES.AUTH,
      retryAfter: 900 // 15 minutes in seconds
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.log(CONSOLE_MESSAGES.AUTH_RATE_LIMITER_TRIGGERED);
    console.log(CONSOLE_MESSAGES.REQUEST_LABEL, req.method, req.originalUrl);
    console.log(CONSOLE_MESSAGES.NODE_ENV_LABEL, env.NODE_ENV);
    logger.warn(getAuthRateLimitWarning(req.ip), {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: (req) => {
    const shouldSkip = env.NODE_ENV === 'test';
    console.log(CONSOLE_MESSAGES.AUTH_RATE_LIMITER_SKIP_CHECK, {
      nodeEnv: env.NODE_ENV,
      shouldSkip,
      url: req.originalUrl,
      method: req.method
    });
    return shouldSkip;
  }
});

// Very strict rate limiter for password reset endpoints
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 password reset requests per hour
  message: {
    success: false,
    error: {
      message: ERROR_MESSAGES.RATE_LIMIT_PASSWORD_RESET,
      type: RATE_LIMIT_TYPES.PASSWORD_RESET,
      retryAfter: 3600 // 1 hour in seconds
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`${LOGGER_MESSAGES.PASSWORD_RESET_RATE_LIMIT_EXCEEDED_IP} ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: (req) => env.NODE_ENV === 'test'
});

// Moderate rate limiter for user profile updates
export const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 profile updates per 15 minutes
  message: {
    success: false,
    error: {
      message: ERROR_MESSAGES.RATE_LIMIT_PROFILE_UPDATE,
      type: RATE_LIMIT_TYPES.PROFILE,
      retryAfter: 900 // 15 minutes in seconds
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`${LOGGER_MESSAGES.PROFILE_UPDATE_RATE_LIMIT_EXCEEDED_IP} ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: (req) => env.NODE_ENV === 'test'
});

// Lenient rate limiter for read-only endpoints (GET requests)
export const readOnlyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 read requests per 15 minutes
  message: {
    success: false,
    error: {
      message: ERROR_MESSAGES.RATE_LIMIT_IP,
      type: RATE_LIMIT_TYPES.READ,
      retryAfter: 900 // 15 minutes in seconds
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`${LOGGER_MESSAGES.READ_ONLY_RATE_LIMIT_EXCEEDED_IP} ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: (req) => env.NODE_ENV === 'test'
});

// Admin endpoints rate limiter (more lenient for admin operations)
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 admin requests per 15 minutes
  message: {
    success: false,
    error: {
      message: ERROR_MESSAGES.RATE_LIMIT_ADMIN,
      type: RATE_LIMIT_TYPES.ADMIN,
      retryAfter: 900 // 15 minutes in seconds
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`${LOGGER_MESSAGES.ADMIN_RATE_LIMIT_EXCEEDED_IP} ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id || 'unknown'
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: (req) => env.NODE_ENV === 'test'
});

/**
 * Create a custom rate limiter with specific configuration
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware function
 */
export const createCustomLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      error: {
        message: ERROR_MESSAGES.RATE_LIMIT_IP,
        type: RATE_LIMIT_TYPES.CUSTOM,
        retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000)
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, opts) => {
      logger.warn(`${LOGGER_MESSAGES.CUSTOM_RATE_LIMIT_EXCEEDED_IP} ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method
      });
      res.status(opts.statusCode).json(opts.message);
    },
    skip: (req) => env.NODE_ENV === 'test'
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * Rate limiter summary for monitoring and debugging
 */
export const getRateLimiterInfo = () => {
  return {
    api: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      description: RATE_LIMIT_DESCRIPTIONS.GENERAL
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 10,
      description: RATE_LIMIT_DESCRIPTIONS.AUTH
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000,
      max: 5,
      description: RATE_LIMIT_DESCRIPTIONS.PASSWORD_RESET
    },
    profile: {
      windowMs: 15 * 60 * 1000,
      max: 20,
      description: RATE_LIMIT_DESCRIPTIONS.PROFILE
    },
    readOnly: {
      windowMs: 15 * 60 * 1000,
      max: 200,
      description: RATE_LIMIT_DESCRIPTIONS.READ
    },
    admin: {
      windowMs: 15 * 60 * 1000,
      max: 50,
      description: RATE_LIMIT_DESCRIPTIONS.ADMIN
    }
  };
};
