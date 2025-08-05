import { ERROR_MESSAGES, AUTH_MESSAGES, USER_ROLES } from '../../../constants/index.js';

// Mock modules with inline factories to avoid hoisting issues
jest.mock('../../../services/index.js', () => ({
  authService: {
    validateAccessToken: jest.fn(),
  },
}));

jest.mock('../../../config/index.js', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../middleware/error_handler.js', () => ({
  AppError: class MockAppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
    }
  },
  asyncHandler: fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  },
}));

// Import the middleware directly to avoid rate limiter initialization issues
import {
  protect,
  authorize,
  optionalAuth,
  checkOwnership,
} from '../../../middleware/auth_middleware.js';
import { authService } from '../../../services/index.js';
import { logger } from '../../../config/index.js';

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    authService.validateAccessToken.mockClear();
    logger.error.mockClear();
    logger.warn.mockClear();
    logger.debug.mockClear();

    // Setup request/response mocks
    req = {
      headers: {},
      cookies: {},
      ip: '192.168.1.1',
      connection: { remoteAddress: '192.168.1.1' },
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('protect middleware', () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      role: USER_ROLES.USER,
      isActive: true,
      isLocked: false,
    };

    const mockSession = {
      _id: 'session123',
      userId: 'user123',
      ipAddress: '192.168.1.1',
    };

    it('should authenticate user with Bearer token in header', async () => {
      req.headers.authorization = 'Bearer validtoken123';
      authService.validateAccessToken.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await protect(req, res, next);

      expect(authService.validateAccessToken).toHaveBeenCalledWith('validtoken123');
      expect(req.user).toEqual(mockUser);
      expect(req.session).toEqual(mockSession);
      expect(next).toHaveBeenCalledWith();
    });

    it('should authenticate user with token in cookies', async () => {
      req.cookies.accessToken = 'cookietoken123';
      authService.validateAccessToken.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await protect(req, res, next);

      expect(authService.validateAccessToken).toHaveBeenCalledWith('cookietoken123');
      expect(req.user).toEqual(mockUser);
      expect(req.session).toEqual(mockSession);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return error when no access token provided', async () => {
      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ERROR_MESSAGES.ACCESS_TOKEN_REQUIRED,
          statusCode: 401,
        }),
      );
    });

    it('should return error when user account is locked', async () => {
      req.headers.authorization = 'Bearer validtoken123';
      const lockedUser = { ...mockUser, isLocked: true };
      authService.validateAccessToken.mockResolvedValue({
        user: lockedUser,
        session: mockSession,
      });

      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ERROR_MESSAGES.ACCOUNT_LOCKED,
          statusCode: 423,
        }),
      );
    });

    it('should return error when user account is inactive', async () => {
      req.headers.authorization = 'Bearer validtoken123';
      const inactiveUser = { ...mockUser, isActive: false };
      authService.validateAccessToken.mockResolvedValue({
        user: inactiveUser,
        session: mockSession,
      });

      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ERROR_MESSAGES.ACCOUNT_DEACTIVATED,
          statusCode: 401,
        }),
      );
    });

    it('should handle invalid token error', async () => {
      req.headers.authorization = 'Bearer invalidtoken123';
      const invalidError = new Error('Invalid token');
      authService.validateAccessToken.mockRejectedValue(invalidError);

      await protect(req, res, next);

      expect(logger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ERROR_MESSAGES.ACCESS_TOKEN_INVALID,
          statusCode: 401,
        }),
      );
    });
  });

  describe('authorize middleware', () => {
    it('should allow access for authorized role', () => {
      req.user = { role: USER_ROLES.ADMIN };
      const middleware = authorize(USER_ROLES.ADMIN, USER_ROLES.USER);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access for unauthorized role', () => {
      req.user = { role: USER_ROLES.USER };
      const middleware = authorize(USER_ROLES.ADMIN);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: AUTH_MESSAGES.ROLE_NOT_AUTHORIZED(USER_ROLES.USER),
          statusCode: 403,
        }),
      );
    });
  });

  describe('optionalAuth middleware', () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      role: USER_ROLES.USER,
      isActive: true,
      isLocked: false,
    };

    const mockSession = {
      _id: 'session123',
      userId: 'user123',
      ipAddress: '192.168.1.1',
    };

    it('should authenticate user when valid token provided', async () => {
      req.headers.authorization = 'Bearer validtoken123';
      authService.validateAccessToken.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await optionalAuth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(req.session).toEqual(mockSession);
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without authentication when no token provided', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(req.session).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without authentication when token is invalid', async () => {
      req.headers.authorization = 'Bearer invalidtoken123';
      authService.validateAccessToken.mockRejectedValue(new Error('Invalid token'));

      await optionalAuth(req, res, next);

      expect(logger.debug).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
      expect(req.session).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('checkOwnership middleware', () => {
    beforeEach(() => {
      req.user = {
        _id: 'user123',
        role: USER_ROLES.USER,
      };
    });

    it('should allow admin to access any resource', () => {
      req.user.role = USER_ROLES.ADMIN;
      const middleware = checkOwnership();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow user to access their own resource', () => {
      req.params.userId = 'user123';
      const middleware = checkOwnership();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny user access to other user resource', () => {
      req.params.userId = 'otheruser456';
      const middleware = checkOwnership();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: AUTH_MESSAGES.NOT_AUTHORIZED_RESOURCE,
          statusCode: 403,
        }),
      );
    });
  });
});
