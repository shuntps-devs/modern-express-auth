// Note: RATE_LIMIT_TYPES and RATE_LIMIT_DESCRIPTIONS are used in middleware but not defined
// Using string literals for testing

// Mock modules with inline factories
jest.mock('../../../config/index.js', () => ({
  env: {
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,
    NODE_ENV: 'test',
    isTest: true,
  },
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('../../../constants/messages.js', () => ({
  ERROR_MESSAGES: {
    RATE_LIMIT_IP: 'Too many requests from this IP',
    RATE_LIMIT_AUTH: 'Too many authentication attempts',
    RATE_LIMIT_PASSWORD_RESET: 'Too many password reset attempts',
    RATE_LIMIT_PROFILE_UPDATE: 'Too many profile update attempts',
    RATE_LIMIT_ADMIN: 'Too many admin requests',
  },
  CONSOLE_MESSAGES: {
    AUTH_RATE_LIMITER_TRIGGERED: 'Auth rate limiter triggered',
    AUTH_RATE_LIMITER_SKIP_CHECK: 'Auth rate limiter skip check',
    REQUEST_LABEL: 'Request',
    NODE_ENV_LABEL: 'Node environment',
  },
  LOGGER_MESSAGES: {
    RATE_LIMIT_EXCEEDED_IP: 'Rate limit exceeded for IP:',
    PASSWORD_RESET_RATE_LIMIT_EXCEEDED_IP: 'Password reset rate limit exceeded for IP:',
    PROFILE_UPDATE_RATE_LIMIT_EXCEEDED_IP: 'Profile update rate limit exceeded for IP:',
    READ_ONLY_RATE_LIMIT_EXCEEDED_IP: 'Read-only rate limit exceeded for IP:',
    ADMIN_RATE_LIMIT_EXCEEDED_IP: 'Admin rate limit exceeded for IP:',
    CUSTOM_RATE_LIMIT_EXCEEDED_IP: 'Custom rate limit exceeded for IP:',
  },
  RATE_LIMIT_TYPES: {
    GENERAL: 'general',
    AUTH: 'auth',
    PASSWORD_RESET: 'password_reset',
    PROFILE: 'profile',
    READ: 'read',
    ADMIN: 'admin',
    CUSTOM: 'custom',
  },
  RATE_LIMIT_DESCRIPTIONS: {
    GENERAL: 'General API rate limiting',
    AUTH: 'Authentication rate limiting',
    PASSWORD_RESET: 'Password reset rate limiting',
    PROFILE: 'Profile update rate limiting',
    READ: 'Read-only rate limiting',
    ADMIN: 'Admin operations rate limiting',
  },
  getAuthRateLimitWarning: jest.fn().mockReturnValue('Auth rate limit warning'),
}));

// Mock express-rate-limit with proper default export
jest.mock('express-rate-limit', () => {
  const mockImplementation = options => {
    const middleware = jest.fn((req, res, next) => {
      // Simulate rate limit behavior
      if (options.skip && options.skip(req)) {
        return next();
      }

      // For testing, we'll simulate hitting the limit based on a test property
      if (req.testHitLimit) {
        return options.handler(req, res, next, {
          statusCode: 429,
          message: options.message,
        });
      }

      next();
    });

    // Attach the options to the middleware for testing
    middleware.options = options;
    return middleware;
  };

  return {
    __esModule: true,
    default: jest.fn().mockImplementation(mockImplementation),
  };
});

// Import directly to avoid barrel export initialization issues
import {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  profileLimiter,
  readOnlyLimiter,
  adminLimiter,
  createCustomLimiter,
  getRateLimiterInfo,
} from '../../../middleware/rate_limiter.js';
import { env, logger } from '../../../config/index.js';

describe('Rate Limiter Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    logger.warn.mockClear();
    logger.info.mockClear();

    // Setup request/response mocks
    req = {
      ip: '192.168.1.1',
      originalUrl: '/api/test',
      method: 'GET',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      user: { id: 'user123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('apiLimiter', () => {
    it('should create rate limiter with correct configuration', () => {
      expect(apiLimiter.options.windowMs).toBe(env.RATE_LIMIT_WINDOW_MS);
      expect(apiLimiter.options.max).toBe(env.RATE_LIMIT_MAX_REQUESTS);
      expect(apiLimiter.options.message.error.type).toBe('general');
    });

    it('should skip rate limiting in test environment', () => {
      apiLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle rate limit exceeded', () => {
      req.testHitLimit = true;
      const options = {
        statusCode: 429,
        message: apiLimiter.options.message,
      };

      // Test the handler directly since our mock doesn't call it automatically
      apiLimiter.options.handler(req, res, next, options);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(apiLimiter.options.message);
    });

    it('should log warning when rate limit is exceeded', () => {
      req.testHitLimit = true;
      const options = {
        statusCode: 429,
        message: apiLimiter.options.message,
      };

      apiLimiter.options.handler(req, res, next, options);

      expect(logger.warn).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(options.message);
    });
  });

  describe('authLimiter', () => {
    it('should create auth rate limiter with strict configuration', () => {
      expect(authLimiter.options.windowMs).toBe(15 * 60 * 1000);
      expect(authLimiter.options.max).toBe(10);
      expect(authLimiter.options.message.error.type).toBe('auth');
    });

    it('should skip rate limiting in test environment', () => {
      const shouldSkip = authLimiter.options.skip(req);
      expect(shouldSkip).toBe(true);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle auth rate limit exceeded with detailed logging', () => {
      req.testHitLimit = true;
      const options = {
        statusCode: 429,
        message: authLimiter.options.message,
      };

      authLimiter.options.handler(req, res, next, options);

      expect(logger.info).toHaveBeenCalledTimes(3); // Multiple info logs
      expect(logger.warn).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(options.message);
    });
  });

  describe('passwordResetLimiter', () => {
    it('should create password reset rate limiter with very strict configuration', () => {
      expect(passwordResetLimiter.options.windowMs).toBe(60 * 60 * 1000); // 1 hour
      expect(passwordResetLimiter.options.max).toBe(5);
      expect(passwordResetLimiter.options.message.error.type).toBe('password_reset');
    });

    it('should skip rate limiting in test environment', () => {
      const shouldSkip = passwordResetLimiter.options.skip(req);
      expect(shouldSkip).toBe(true);
    });

    it('should handle password reset rate limit exceeded', () => {
      req.testHitLimit = true;
      const options = {
        statusCode: 429,
        message: passwordResetLimiter.options.message,
      };

      passwordResetLimiter.options.handler(req, res, next, options);

      expect(logger.warn).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(options.message);
    });
  });

  describe('profileLimiter', () => {
    it('should create profile rate limiter with moderate configuration', () => {
      expect(profileLimiter.options.windowMs).toBe(15 * 60 * 1000);
      expect(profileLimiter.options.max).toBe(20);
      expect(profileLimiter.options.message.error.type).toBe('profile');
    });

    it('should skip rate limiting in test environment', () => {
      const shouldSkip = profileLimiter.options.skip(req);
      expect(shouldSkip).toBe(true);
    });

    it('should handle profile update rate limit exceeded', () => {
      req.testHitLimit = true;
      const options = {
        statusCode: 429,
        message: profileLimiter.options.message,
      };

      profileLimiter.options.handler(req, res, next, options);

      expect(logger.warn).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(options.message);
    });
  });

  describe('readOnlyLimiter', () => {
    it('should create read-only rate limiter with lenient configuration', () => {
      expect(readOnlyLimiter.options.windowMs).toBe(15 * 60 * 1000);
      expect(readOnlyLimiter.options.max).toBe(200);
      expect(readOnlyLimiter.options.message.error.type).toBe('read');
    });

    it('should skip rate limiting in test environment', () => {
      const shouldSkip = readOnlyLimiter.options.skip(req);
      expect(shouldSkip).toBe(true);
    });

    it('should handle read-only rate limit exceeded', () => {
      req.testHitLimit = true;
      const options = {
        statusCode: 429,
        message: readOnlyLimiter.options.message,
      };

      readOnlyLimiter.options.handler(req, res, next, options);

      expect(logger.warn).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(options.message);
    });
  });

  describe('adminLimiter', () => {
    it('should create admin rate limiter with moderate configuration', () => {
      expect(adminLimiter.options.windowMs).toBe(15 * 60 * 1000);
      expect(adminLimiter.options.max).toBe(50);
      expect(adminLimiter.options.message.error.type).toBe('admin');
    });

    it('should skip rate limiting in test environment', () => {
      const shouldSkip = adminLimiter.options.skip(req);
      expect(shouldSkip).toBe(true);
    });

    it('should handle admin rate limit exceeded with user ID logging', () => {
      req.testHitLimit = true;
      const options = {
        statusCode: 429,
        message: adminLimiter.options.message,
      };

      adminLimiter.options.handler(req, res, next, options);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('192.168.1.1'),
        expect.objectContaining({
          userId: 'user123',
        }),
      );
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(options.message);
    });

    it('should handle admin rate limit exceeded without user ID', () => {
      req.user = null;
      req.testHitLimit = true;
      const options = {
        statusCode: 429,
        message: adminLimiter.options.message,
      };

      adminLimiter.options.handler(req, res, next, options);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('192.168.1.1'),
        expect.objectContaining({
          userId: 'unknown',
        }),
      );
    });
  });

  describe('createCustomLimiter', () => {
    it('should create custom rate limiter with default options', () => {
      const customLimiter = createCustomLimiter();

      expect(customLimiter.options.windowMs).toBe(env.RATE_LIMIT_WINDOW_MS);
      expect(customLimiter.options.max).toBe(env.RATE_LIMIT_MAX_REQUESTS);
      expect(customLimiter.options.message.error.type).toBe('custom');
    });

    it('should create custom rate limiter with custom options', () => {
      const customOptions = {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 50,
        message: {
          success: false,
          error: {
            message: 'Custom rate limit message',
            type: 'custom_type',
          },
        },
      };

      const customLimiter = createCustomLimiter(customOptions);

      expect(customLimiter.options.windowMs).toBe(customOptions.windowMs);
      expect(customLimiter.options.max).toBe(customOptions.max);
      expect(customLimiter.options.message).toEqual(customOptions.message);
    });

    it('should handle custom rate limit exceeded', () => {
      const customLimiter = createCustomLimiter();
      req.testHitLimit = true;
      const options = {
        statusCode: 429,
        message: customLimiter.options.message,
      };

      customLimiter.options.handler(req, res, next, options);

      expect(logger.warn).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(options.message);
    });
  });

  describe('getRateLimiterInfo', () => {
    it('should return rate limiter configuration info', () => {
      const info = getRateLimiterInfo();

      expect(info).toHaveProperty('api');
      expect(info).toHaveProperty('auth');
      expect(info).toHaveProperty('passwordReset');
      expect(info).toHaveProperty('profile');
      expect(info).toHaveProperty('readOnly');
      expect(info).toHaveProperty('admin');

      expect(info.api.windowMs).toBe(env.RATE_LIMIT_WINDOW_MS);
      expect(info.api.max).toBe(env.RATE_LIMIT_MAX_REQUESTS);
      expect(info.api.description).toBe('General API rate limiting');

      expect(info.auth.windowMs).toBe(15 * 60 * 1000);
      expect(info.auth.max).toBe(10);
      expect(info.auth.description).toBe('Authentication rate limiting');

      expect(info.passwordReset.windowMs).toBe(60 * 60 * 1000);
      expect(info.passwordReset.max).toBe(5);
      expect(info.passwordReset.description).toBe('Password reset rate limiting');
    });

    it('should return correct configuration for all limiters', () => {
      const info = getRateLimiterInfo();

      expect(info.profile.max).toBe(20);
      expect(info.readOnly.max).toBe(200);
      expect(info.admin.max).toBe(50);

      expect(info.profile.description).toBe('Profile update rate limiting');
      expect(info.readOnly.description).toBe('Read-only rate limiting');
      expect(info.admin.description).toBe('Admin operations rate limiting');
    });
  });
});
