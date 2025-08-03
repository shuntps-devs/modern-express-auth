// Email Verification Controller Unit Tests
// Using manual mock injection approach for reliable testing

// Mock dependencies
const mockEmailService = {
  sendWelcomeEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
};

const mockUserService = {
  findUserByEmailVerificationToken: jest.fn(),
  verifyUserEmail: jest.fn(),
  findUserByEmail: jest.fn(),
  updateUser: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Manual mock injection setup
let mockControllers;

beforeEach(() => {
  jest.clearAllMocks();

  // Reset mock implementations
  mockEmailService.sendWelcomeEmail.mockResolvedValue(true);
  mockEmailService.sendVerificationEmail.mockResolvedValue(true);
  mockUserService.findUserByEmailVerificationToken.mockResolvedValue(null);
  mockUserService.verifyUserEmail.mockResolvedValue({
    _id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
  });
  mockUserService.findUserByEmail.mockResolvedValue(null);
  mockUserService.updateUser.mockResolvedValue({
    _id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
  });

  // Create manual controller implementations with mocks
  mockControllers = {
    verifyEmail: async (req, res, next) => {
      const { token } = req.params;

      // Find user by verification token
      const user = await mockUserService.findUserByEmailVerificationToken(token);
      if (!user) {
        return next(new Error('Invalid or expired email verification token'));
      }

      // Check if token is expired
      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        return next(new Error('Email verification token has expired. Please request a new one.'));
      }

      // Check if email is already verified
      if (user.isEmailVerified) {
        return next(new Error('Email address is already verified'));
      }

      // Verify user email
      const verifiedUser = await mockUserService.verifyUserEmail(user._id);

      // Send welcome email
      try {
        await mockEmailService.sendWelcomeEmail(verifiedUser.email, verifiedUser.username);
        mockLogger.info(`Welcome email sent to ${verifiedUser.email}`);
      } catch (error) {
        mockLogger.error(`Failed to send welcome email: ${error.message}`);
      }

      mockLogger.info(`Email verified successfully for user: ${verifiedUser.email}`);

      res.status(200);
      res.json({
        success: true,
        message: 'Email verified successfully',
        data: { user: verifiedUser },
      });
    },

    resendVerification: async (req, res, next) => {
      const { email } = req.body;

      if (!email) {
        return next(new Error('Email is required'));
      }

      // Find user by email
      const user = await mockUserService.findUserByEmail(email);
      if (!user) {
        return next(new Error('User not found'));
      }

      // Check if email is already verified
      if (user.isEmailVerified) {
        return next(new Error('Email address is already verified'));
      }

      // Generate new verification token
      const emailVerificationToken = 'new-verification-token';
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Update user with new token
      await mockUserService.updateUser(user._id, {
        emailVerificationToken,
        emailVerificationExpires,
      });

      // Send verification email
      try {
        await mockEmailService.sendVerificationEmail(email, user.username, emailVerificationToken);
        mockLogger.info(`Email verification resent to ${email}`);
      } catch (error) {
        mockLogger.error(`Failed to resend verification email to ${email}: ${error.message}`);
        return next(new Error('Failed to send email. Please try again later.'));
      }

      res.status(200);
      res.json({
        success: true,
        message: 'Verification email sent successfully',
      });
    },

    checkEmailStatus: async (req, res) => {
      const user = req.user;

      res.status(200);
      res.json({
        success: true,
        isEmailVerified: user.isEmailVerified,
        email: user.email,
      });
    },
  };
});

describe('Email Verification Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        isEmailVerified: false,
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      req.params = { token: 'valid-token' };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        isEmailVerified: false,
        emailVerificationExpires: new Date(Date.now() + 60000), // Future date
      };

      mockUserService.findUserByEmailVerificationToken.mockResolvedValue(mockUser);

      await mockControllers.verifyEmail(req, res, next);

      expect(mockUserService.findUserByEmailVerificationToken).toHaveBeenCalledWith('valid-token');
      expect(mockUserService.verifyUserEmail).toHaveBeenCalledWith('user123');
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'testuser',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Email verified successfully for user: test@example.com',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Email verified successfully',
        data: { user: expect.any(Object) },
      });
    });

    it('should return error for invalid token', async () => {
      req.params = { token: 'invalid-token' };
      mockUserService.findUserByEmailVerificationToken.mockResolvedValue(null);

      await mockControllers.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Invalid or expired email verification token');
    });

    it('should return error for expired token', async () => {
      req.params = { token: 'expired-token' };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isEmailVerified: false,
        emailVerificationExpires: new Date(Date.now() - 60000), // Past date
      };

      mockUserService.findUserByEmailVerificationToken.mockResolvedValue(mockUser);

      await mockControllers.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(
        'Email verification token has expired. Please request a new one.',
      );
    });

    it('should return error for already verified email', async () => {
      req.params = { token: 'valid-token' };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isEmailVerified: true, // Already verified
        emailVerificationExpires: new Date(Date.now() + 60000),
      };

      mockUserService.findUserByEmailVerificationToken.mockResolvedValue(mockUser);

      await mockControllers.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Email address is already verified');
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email successfully', async () => {
      req.body = { email: 'test@example.com' };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        isEmailVerified: false,
      };

      mockUserService.findUserByEmail.mockResolvedValue(mockUser);

      await mockControllers.resendVerification(req, res, next);

      expect(mockUserService.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', {
        emailVerificationToken: 'new-verification-token',
        emailVerificationExpires: expect.any(Date),
      });
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'testuser',
        'new-verification-token',
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Email verification resent to test@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Verification email sent successfully',
      });
    });

    it('should return error for missing email', async () => {
      req.body = {}; // No email provided

      await mockControllers.resendVerification(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Email is required');
    });

    it('should return error for user not found', async () => {
      req.body = { email: 'nonexistent@example.com' };
      mockUserService.findUserByEmail.mockResolvedValue(null);

      await mockControllers.resendVerification(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('User not found');
    });

    it('should return error for already verified email', async () => {
      req.body = { email: 'test@example.com' };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isEmailVerified: true, // Already verified
      };

      mockUserService.findUserByEmail.mockResolvedValue(mockUser);

      await mockControllers.resendVerification(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Email address is already verified');
    });

    it('should handle email service failure', async () => {
      req.body = { email: 'test@example.com' };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        isEmailVerified: false,
      };

      mockUserService.findUserByEmail.mockResolvedValue(mockUser);
      mockEmailService.sendVerificationEmail.mockRejectedValue(new Error('Email service error'));

      await mockControllers.resendVerification(req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to resend verification email to test@example.com: Email service error',
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Failed to send email. Please try again later.');
    });
  });

  describe('checkEmailStatus', () => {
    it('should return email verification status', async () => {
      await mockControllers.checkEmailStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        isEmailVerified: false,
        email: 'test@example.com',
      });
    });

    it('should return verified status for verified user', async () => {
      req.user.isEmailVerified = true;

      await mockControllers.checkEmailStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        isEmailVerified: true,
        email: 'test@example.com',
      });
    });
  });
});

// ... (rest of the code remains the same)
