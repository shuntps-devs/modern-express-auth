import rateLimit from 'express-rate-limit';
import { env, logger } from '../config/index.js';
import {
  ERROR_MESSAGES,
  RATE_LIMIT_TYPES,
  RATE_LIMIT_DESCRIPTIONS,
  getAuthRateLimitWarning,
} from '../constants/index.js';

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      message: ERROR_MESSAGES.RATE_LIMIT_IP,
      type: RATE_LIMIT_TYPES.GENERAL,
      retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: _req => {
    return env.isTest;
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      message: ERROR_MESSAGES.RATE_LIMIT_AUTH,
      type: RATE_LIMIT_TYPES.AUTH,
      retryAfter: 900,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.info('Auth rate limiter triggered');
    logger.info('Request:', { method: req.method, url: req.originalUrl });
    logger.info('Node environment:', { nodeEnv: env.NODE_ENV });
    logger.warn(getAuthRateLimitWarning(req.ip), {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: req => {
    const shouldSkip = env.NODE_ENV === 'test';
    logger.info('Auth rate limiter skip check:', {
      nodeEnv: env.NODE_ENV,
      shouldSkip,
      url: req.originalUrl,
      method: req.method,
    });
    return shouldSkip;
  },
});

export const avatarUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      message: ERROR_MESSAGES.RATE_LIMIT_AVATAR_UPLOAD,
      type: RATE_LIMIT_TYPES.AVATAR_UPLOAD,
      retryAfter: 3600,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Avatar upload rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id || 'anonymous',
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: _req => env.NODE_ENV === 'test',
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      message: ERROR_MESSAGES.RATE_LIMIT_PASSWORD_RESET,
      type: RATE_LIMIT_TYPES.PASSWORD_RESET,
      retryAfter: 3600,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: _req => env.NODE_ENV === 'test',
});

export const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      message: ERROR_MESSAGES.RATE_LIMIT_PROFILE_UPDATE,
      type: RATE_LIMIT_TYPES.PROFILE,
      retryAfter: 900,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Profile update rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: _req => env.NODE_ENV === 'test',
});

export const readOnlyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    error: {
      message: ERROR_MESSAGES.RATE_LIMIT_IP,
      type: RATE_LIMIT_TYPES.READ,
      retryAfter: 900,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Read-only rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: _req => env.NODE_ENV === 'test',
});

export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: {
      message: ERROR_MESSAGES.RATE_LIMIT_ADMIN,
      type: RATE_LIMIT_TYPES.ADMIN,
      retryAfter: 900,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Admin rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id || 'unknown',
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: _req => env.NODE_ENV === 'test',
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
        retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, opts) => {
      logger.warn(`Custom rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method,
      });
      res.status(opts.statusCode).json(opts.message);
    },
    skip: _req => env.NODE_ENV === 'test',
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
      description: RATE_LIMIT_DESCRIPTIONS.GENERAL,
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 10,
      description: RATE_LIMIT_DESCRIPTIONS.AUTH,
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000,
      max: 5,
      description: RATE_LIMIT_DESCRIPTIONS.PASSWORD_RESET,
    },
    profile: {
      windowMs: 15 * 60 * 1000,
      max: 20,
      description: RATE_LIMIT_DESCRIPTIONS.PROFILE,
    },
    readOnly: {
      windowMs: 15 * 60 * 1000,
      max: 200,
      description: RATE_LIMIT_DESCRIPTIONS.READ,
    },
    admin: {
      windowMs: 15 * 60 * 1000,
      max: 50,
      description: RATE_LIMIT_DESCRIPTIONS.ADMIN,
    },
  };
};
