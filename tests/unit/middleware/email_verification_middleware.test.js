// Mock modules with inline factories
jest.mock('../../../middleware/error_handler.js', () => ({
  AppError: jest.fn().mockImplementation((message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    error.isOperational = true;
    return error;
  }),
}));

jest.mock('../../../constants/index.js', () => ({
  ERROR_MESSAGES: {
    EMAIL_NOT_VERIFIED: 'Email address not verified',
    EMAIL_VERIFICATION_REQUIRED: 'Email verification required for this action',
  },
}));

// Import after mocks
import {
  requireEmailVerification,
  optionalEmailVerification,
  emailVerificationRequired,
} from '../../../middleware/email_verification_middleware.js';
import { ERROR_MESSAGES } from '../../../constants/index.js';

describe('Email Verification Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup request/response mocks
    req = {
      user: null,
      isEmailVerified: undefined,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('requireEmailVerification', () => {
    it('should call next with error if user is not authenticated', () => {
      req.user = null;

      requireEmailVerification(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Authentication required');
      expect(next.mock.calls[0][0].statusCode).toBe(401);
    });

    it('should call next with error if user email is not verified', () => {
      req.user = {
        id: 'user123',
        email: 'test@example.com',
        isEmailVerified: false,
      };

      requireEmailVerification(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(ERROR_MESSAGES.EMAIL_NOT_VERIFIED);
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it('should call next without error if user email is verified', () => {
      req.user = {
        id: 'user123',
        email: 'test@example.com',
        isEmailVerified: true,
      };

      requireEmailVerification(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle user with undefined isEmailVerified as not verified', () => {
      req.user = {
        id: 'user123',
        email: 'test@example.com',
        // isEmailVerified is undefined
      };

      requireEmailVerification(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(ERROR_MESSAGES.EMAIL_NOT_VERIFIED);
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });
  });

  describe('optionalEmailVerification', () => {
    it('should set isEmailVerified to false when user is not authenticated', () => {
      req.user = null;

      optionalEmailVerification(req, res, next);

      expect(req.isEmailVerified).toBe(false);
      expect(next).toHaveBeenCalledWith();
    });

    it('should set isEmailVerified to false when user email is not verified', () => {
      req.user = {
        id: 'user123',
        email: 'test@example.com',
        isEmailVerified: false,
      };

      optionalEmailVerification(req, res, next);

      expect(req.isEmailVerified).toBe(false);
      expect(next).toHaveBeenCalledWith();
    });

    it('should set isEmailVerified to true when user email is verified', () => {
      req.user = {
        id: 'user123',
        email: 'test@example.com',
        isEmailVerified: true,
      };

      optionalEmailVerification(req, res, next);

      expect(req.isEmailVerified).toBe(true);
      expect(next).toHaveBeenCalledWith();
    });

    it('should set isEmailVerified to false when user has undefined isEmailVerified', () => {
      req.user = {
        id: 'user123',
        email: 'test@example.com',
        // isEmailVerified is undefined
      };

      optionalEmailVerification(req, res, next);

      expect(req.isEmailVerified).toBe(false);
      expect(next).toHaveBeenCalledWith();
    });

    it('should always call next without error', () => {
      // Test with various user states
      const userStates = [
        null,
        { isEmailVerified: false },
        { isEmailVerified: true },
        { isEmailVerified: undefined },
      ];

      userStates.forEach((user, _index) => {
        req.user = user;
        next.mockClear();

        optionalEmailVerification(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(next).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('emailVerificationRequired', () => {
    it('should return a middleware function', () => {
      const middleware = emailVerificationRequired();
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // req, res, next parameters
    });

    it('should call next with error if user is not authenticated', () => {
      const middleware = emailVerificationRequired();
      req.user = null;

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Authentication required');
      expect(next.mock.calls[0][0].statusCode).toBe(401);
    });

    it('should skip verification for admin users by default', () => {
      const middleware = emailVerificationRequired();
      req.user = {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        isEmailVerified: false,
      };

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should not skip verification for admin users when skipForAdmins is false', () => {
      const middleware = emailVerificationRequired({ skipForAdmins: false });
      req.user = {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        isEmailVerified: false,
      };

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(ERROR_MESSAGES.EMAIL_VERIFICATION_REQUIRED);
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it('should call next with error if regular user email is not verified', () => {
      const middleware = emailVerificationRequired();
      req.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: false,
      };

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(ERROR_MESSAGES.EMAIL_VERIFICATION_REQUIRED);
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it('should call next without error if regular user email is verified', () => {
      const middleware = emailVerificationRequired();
      req.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: true,
      };

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom verification required message';
      const middleware = emailVerificationRequired({ customMessage });
      req.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: false,
      };

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(customMessage);
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it('should handle user with undefined isEmailVerified as not verified', () => {
      const middleware = emailVerificationRequired();
      req.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        // isEmailVerified is undefined
      };

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(ERROR_MESSAGES.EMAIL_VERIFICATION_REQUIRED);
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it('should work with both skipForAdmins and customMessage options', () => {
      const customMessage = 'Special verification message';
      const middleware = emailVerificationRequired({
        skipForAdmins: false,
        customMessage,
      });
      req.user = {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        isEmailVerified: false,
      };

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(customMessage);
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it('should handle empty options object', () => {
      const middleware = emailVerificationRequired({});
      req.user = {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        isEmailVerified: false,
      };

      middleware(req, res, next);

      // Should skip for admin by default
      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
