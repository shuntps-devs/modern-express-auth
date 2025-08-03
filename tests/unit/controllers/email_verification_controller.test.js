import { jest } from '@jest/globals';
import {
  verifyEmail,
  resendVerification,
  checkEmailStatus,
} from '../../../controllers/email_verification_controller.js';
import { userService, emailService } from '../../../services/index.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../constants/index.js';

// Mock services
jest.mock('../../../services/index.js', () => ({
  userService: {
    findUserByEmailVerificationToken: jest.fn(),
    verifyUserEmail: jest.fn(),
    findUserByEmail: jest.fn(),
    updateEmailVerificationToken: jest.fn(),
  },
  emailService: {
    sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
    sendEmailVerification: jest.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock-token-123'),
  }),
}));

describe('Email Verification Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Reset mock implementations
    userService.findUserByEmailVerificationToken.mockReset();
    userService.verifyUserEmail.mockReset();
    userService.findUserByEmail.mockReset();
    userService.updateEmailVerificationToken.mockReset();
    emailService.sendWelcomeEmail.mockReset();
    emailService.sendEmailVerification.mockReset();
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        isEmailVerified: false,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      req.params.token = 'valid-token';
      userService.findUserByEmailVerificationToken.mockResolvedValue(mockUser);
      userService.verifyUserEmail.mockResolvedValue(mockUser);
      emailService.sendWelcomeEmail.mockResolvedValue({ success: true });

      await verifyEmail(req, res, next);

      expect(userService.findUserByEmailVerificationToken).toHaveBeenCalledWith('valid-token');
      expect(userService.verifyUserEmail).toHaveBeenCalledWith('user123');
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith('test@example.com', 'testuser');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: SUCCESS_MESSAGES.EMAIL_VERIFIED_SUCCESS,
      });
    });

    it('should return error for invalid token', async () => {
      req.params.token = 'invalid-token';
      userService.findUserByEmailVerificationToken.mockResolvedValue(null);

      await verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ERROR_MESSAGES.EMAIL_VERIFICATION_TOKEN_INVALID,
          statusCode: 400,
        }),
      );
    });

    it('should return error for expired token', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        isEmailVerified: false,
        emailVerificationExpires: new Date(Date.now() - 1000), // Expired
      };

      req.params.token = 'expired-token';
      userService.findUserByEmailVerificationToken.mockResolvedValue(mockUser);

      await verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ERROR_MESSAGES.EMAIL_VERIFICATION_TOKEN_EXPIRED,
          statusCode: 400,
        }),
      );
    });

    it('should return error for already verified email', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        isEmailVerified: true,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      req.params.token = 'valid-token';
      userService.findUserByEmailVerificationToken.mockResolvedValue(mockUser);

      await verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED,
          statusCode: 400,
        }),
      );
    });

    it('should continue even if welcome email fails', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        isEmailVerified: false,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      req.params.token = 'valid-token';
      userService.findUserByEmailVerificationToken.mockResolvedValue(mockUser);
      userService.verifyUserEmail.mockResolvedValue(mockUser);
      emailService.sendWelcomeEmail.mockRejectedValue(new Error('Email service error'));

      await verifyEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: SUCCESS_MESSAGES.EMAIL_VERIFIED_SUCCESS,
      });
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email successfully', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        isEmailVerified: false,
      };

      req.body.email = 'test@example.com';
      userService.findUserByEmail.mockResolvedValue(mockUser);
      userService.updateEmailVerificationToken.mockResolvedValue(mockUser);
      emailService.sendEmailVerification.mockResolvedValue({ success: true });

      await resendVerification(req, res, next);

      expect(userService.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userService.updateEmailVerificationToken).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          emailVerificationToken: 'mock-token-123',
          emailVerificationExpires: expect.any(Date),
        }),
      );
      expect(emailService.sendEmailVerification).toHaveBeenCalledWith(
        'test@example.com',
        'testuser',
        'mock-token-123',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: SUCCESS_MESSAGES.EMAIL_VERIFICATION_SENT,
      });
    });

    it('should return error for missing email', async () => {
      req.body = {};

      await resendVerification(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email is required',
          statusCode: 400,
        }),
      );
    });

    it('should return error for user not found', async () => {
      req.body.email = 'nonexistent@example.com';
      userService.findUserByEmail.mockResolvedValue(null);

      await resendVerification(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ERROR_MESSAGES.USER_NOT_FOUND,
          statusCode: 404,
        }),
      );
    });

    it('should return error for already verified email', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        isEmailVerified: true,
      };

      req.body.email = 'test@example.com';
      userService.findUserByEmail.mockResolvedValue(mockUser);

      await resendVerification(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED,
          statusCode: 400,
        }),
      );
    });

    it('should return error if email sending fails', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        isEmailVerified: false,
      };

      req.body.email = 'test@example.com';
      userService.findUserByEmail.mockResolvedValue(mockUser);
      userService.updateEmailVerificationToken.mockResolvedValue(mockUser);
      emailService.sendEmailVerification.mockRejectedValue(new Error('Email service error'));

      await resendVerification(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ERROR_MESSAGES.EMAIL_SEND_FAILED,
          statusCode: 500,
        }),
      );
    });
  });

  describe('checkEmailStatus', () => {
    it('should return email verification status', async () => {
      req.user = {
        _id: 'user123',
        email: 'test@example.com',
        isEmailVerified: true,
      };

      await checkEmailStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          isEmailVerified: true,
          email: 'test@example.com',
        },
      });
    });

    it('should return unverified status', async () => {
      req.user = {
        _id: 'user123',
        email: 'test@example.com',
        isEmailVerified: false,
      };

      await checkEmailStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          isEmailVerified: false,
          email: 'test@example.com',
        },
      });
    });
  });
});
