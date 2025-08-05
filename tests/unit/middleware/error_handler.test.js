import { ERROR_MESSAGES } from '../../../constants/index.js';

// Mock modules with inline factories
jest.mock('../../../config/index.js', () => ({
  env: {
    NODE_ENV: 'test',
  },
  logger: {
    error: jest.fn(),
  },
}));

// Import directly to avoid barrel export initialization issues
import { AppError, asyncHandler, errorHandler } from '../../../middleware/error_handler.js';
import { logger, env } from '../../../config/index.js';

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    logger.error.mockClear();

    // Setup request/response mocks
    req = {
      url: '/test',
      method: 'GET',
      ip: '192.168.1.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('AppError class', () => {
    it('should create AppError with correct properties', () => {
      const message = 'Test error message';
      const statusCode = 400;
      const error = new AppError(message, statusCode);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(statusCode);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
    });

    it('should set status to "fail" for 4xx errors', () => {
      const error = new AppError('Client error', 404);
      expect(error.status).toBe('fail');
    });

    it('should set status to "error" for 5xx errors', () => {
      const error = new AppError('Server error', 500);
      expect(error.status).toBe('error');
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 400);
      expect(error.stack).toBeDefined();
    });
  });

  describe('asyncHandler wrapper', () => {
    it('should call next function for successful async function', async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(mockAsyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error for rejected async function', async () => {
      const testError = new Error('Async error');
      const mockAsyncFn = jest.fn().mockRejectedValue(testError);
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(mockAsyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(testError);
    });

    it('should return a function that wraps async operations', () => {
      const mockAsyncFn = jest.fn();
      const wrappedFn = asyncHandler(mockAsyncFn);

      expect(typeof wrappedFn).toBe('function');
      expect(wrappedFn.length).toBe(3); // req, res, next parameters
    });
  });

  describe('errorHandler middleware', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Test error', 400);

      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith({
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: 'Mozilla/5.0',
      });

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
        },
      });
    });

    it('should handle generic Error correctly', () => {
      const error = new Error('Generic error');

      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Generic error',
        },
      });
    });

    it('should handle Mongoose CastError', () => {
      const error = {
        name: 'CastError',
        message: 'Cast to ObjectId failed',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.RESOURCE_NOT_FOUND,
        },
      });
    });

    it('should handle Mongoose duplicate key error', () => {
      const error = {
        code: 11000,
        keyValue: { email: 'test@example.com' },
        message: 'Duplicate key error',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Email already exists',
        },
      });
    });

    it('should handle Mongoose validation error', () => {
      const error = {
        name: 'ValidationError',
        errors: {
          email: { message: 'Email is required' },
          password: { message: 'Password is too short' },
        },
        message: 'Validation failed',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Email is required, Password is too short',
        },
      });
    });

    it('should handle JWT JsonWebTokenError', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'invalid token',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.JWT_INVALID,
        },
      });
    });

    it('should handle JWT TokenExpiredError', () => {
      const error = {
        name: 'TokenExpiredError',
        message: 'jwt expired',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.TOKEN_EXPIRED,
        },
      });
    });

    it('should handle rate limit error', () => {
      const error = {
        status: 429,
        message: 'Too many requests',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
        },
      });
    });

    it('should include stack trace in development mode', () => {
      // Mock development environment
      env.NODE_ENV = 'development';

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
          stack: 'Error stack trace',
        },
      });

      // Reset to test environment
      env.NODE_ENV = 'test';
    });

    it('should not include stack trace in production mode', () => {
      // Mock production environment
      env.NODE_ENV = 'production';

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
        },
      });

      // Reset to test environment
      env.NODE_ENV = 'test';
    });

    it('should use default error message when error message is missing', () => {
      const error = {};

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR,
        },
      });
    });

    it('should handle error without statusCode', () => {
      const error = {
        message: 'Error without status code',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Error without status code',
        },
      });
    });
  });
});
