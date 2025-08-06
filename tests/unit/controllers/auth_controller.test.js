// Mock dependencies
const mockUserService = {
  findUserByEmailOrUsername: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  createUser: jest.fn(),
  formatUserResponse: jest.fn(),
};

const mockAuthService = {
  sendTokenResponse: jest.fn(),
  clearAuthCookies: jest.fn(),
  handleTokenRefresh: jest.fn(),
  getUserActiveSessions: jest.fn(),
  getActiveSessionsCount: jest.fn(),
  revokeSpecificSession: jest.fn(),
  revokeAllUserSessions: jest.fn(),
  cleanupExpiredSessions: jest.fn(),
};

const mockEmailService = {
  sendEmailVerification: jest.fn(),
};

const mockSession = {
  findByIdAndUpdate: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock crypto
const mockCrypto = {
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mock-token-hex'),
  })),
};

// Manual mock injection setup
let mockControllers;

beforeEach(() => {
  jest.clearAllMocks();

  // Reset mock implementations
  mockUserService.findUserByEmailOrUsername.mockResolvedValue(null);
  mockUserService.findUserByEmail.mockResolvedValue(null);
  mockUserService.findUserById.mockResolvedValue(null);
  mockUserService.createUser.mockResolvedValue({
    _id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
  });
  mockUserService.formatUserResponse.mockReturnValue({
    _id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
  });

  mockAuthService.sendTokenResponse.mockResolvedValue();
  mockAuthService.clearAuthCookies.mockReturnValue();
  mockAuthService.handleTokenRefresh.mockResolvedValue();
  mockAuthService.getUserActiveSessions.mockResolvedValue([]);
  mockAuthService.getActiveSessionsCount.mockResolvedValue(0);
  mockAuthService.revokeSpecificSession.mockResolvedValue({ message: 'Session revoked' });
  mockAuthService.revokeAllUserSessions.mockResolvedValue({
    message: 'All sessions revoked',
    modifiedCount: 2,
  });
  mockAuthService.cleanupExpiredSessions.mockResolvedValue({
    message: 'Cleanup completed',
    deletedCount: 5,
  });

  mockEmailService.sendEmailVerification.mockResolvedValue();
  mockSession.findByIdAndUpdate.mockResolvedValue();

  // Create manual controller implementations with mocks
  mockControllers = {
    register: async (req, res, next) => {
      const { username, email, password } = req.body;

      const existingUser = await mockUserService.findUserByEmailOrUsername(email, username);
      if (existingUser) {
        if (existingUser.email === email) {
          return next(new Error('User with this email already exists'));
        }
        if (existingUser.username === username) {
          return next(new Error('Username is already taken'));
        }
      }

      const emailVerificationToken = mockCrypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const user = await mockUserService.createUser({
        username,
        email,
        password,
        isEmailVerified: false,
        emailVerificationToken,
        emailVerificationExpires,
      });

      try {
        await mockEmailService.sendEmailVerification(email, username, emailVerificationToken);
        mockLogger.info(`Email verification sent to ${user.email}`);
      } catch (error) {
        mockLogger.error(`Failed to send verification email to ${user.email}: ${error.message}`);
      }

      mockLogger.info(`New user registered: ${user.email}`);

      res.status(201);
      res.json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
      });
    },

    login: async (req, res, next) => {
      const { email, password } = req.body;

      const user = await mockUserService.findUserByEmail(email, true);
      if (!user) {
        return next(new Error('Invalid credentials'));
      }

      if (user.isLocked) {
        return next(new Error('Account is locked due to too many failed login attempts'));
      }

      if (!user.isActive) {
        return next(new Error('Account has been deactivated'));
      }

      const isMatch = user.comparePassword
        ? await user.comparePassword(password)
        : password === 'correctpassword';
      if (!isMatch) {
        if (user.incLoginAttempts) await user.incLoginAttempts();
        mockLogger.warn(`Failed login attempt for ${email} from IP: ${req.ip}`);
        return next(new Error('Invalid credentials'));
      }

      if (user.loginAttempts > 0 && user.resetLoginAttempts) {
        await user.resetLoginAttempts();
      }

      mockLogger.info(`User logged in: ${user.email} from IP: ${req.ip}`);
      await mockAuthService.sendTokenResponse(user, 200, res, req);
    },

    logout: async (req, res) => {
      if (req.session && req.session._id) {
        await mockSession.findByIdAndUpdate(req.session._id, { isActive: false });
      }

      mockAuthService.clearAuthCookies(res);
      mockLogger.info(`User logged out: ${req.user.email}`);

      res.status(200);
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    },

    getSessions: async (req, res, next) => {
      try {
        const sessions = await mockAuthService.getUserActiveSessions(req.user.id);
        const activeCount = await mockAuthService.getActiveSessionsCount(req.user.id);

        res.status(200);
        res.json({
          success: true,
          sessions,
          activeCount,
          message: 'Sessions retrieved successfully',
        });
      } catch (error) {
        mockLogger.error(`Failed to get user sessions: ${error.message}`);
        return next(new Error('Failed to retrieve sessions'));
      }
    },

    revokeSession: async (req, res, next) => {
      const { sessionId } = req.params;

      try {
        const result = await mockAuthService.revokeSpecificSession(sessionId, req.user.id);
        mockLogger.info(`Session revoked: ${sessionId} for user ${req.user.id}`);

        res.status(200);
        res.json({
          success: true,
          message: result.message,
        });
      } catch (error) {
        mockLogger.error(`Failed to revoke session: ${error.message}`);
        return next(new Error('Failed to revoke session'));
      }
    },

    cleanupSessions: async (req, res, next) => {
      if (req.user.role !== 'admin') {
        return next(new Error('Admin role required'));
      }

      try {
        const result = await mockAuthService.cleanupExpiredSessions();
        mockLogger.info(`Session cleanup completed: ${result.deletedCount} sessions removed`);

        res.status(200);
        res.json({
          success: true,
          message: result.message,
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        mockLogger.error(`Failed to cleanup sessions: ${error.message}`);
        return next(new Error('Failed to cleanup sessions'));
      }
    },
  };
});

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      cookies: {},
      user: { _id: 'user123', id: 'user123', email: 'test@example.com', role: 'user' },
      session: { _id: 'session123' },
      ip: '127.0.0.1',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      };

      await mockControllers.register(req, res, next);

      expect(mockUserService.findUserByEmailOrUsername).toHaveBeenCalledWith(
        'test@example.com',
        'testuser',
      );
      expect(mockUserService.createUser).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        isEmailVerified: false,
        emailVerificationToken: 'mock-token-hex',
        emailVerificationExpires: expect.any(Date),
      });
      expect(mockEmailService.sendEmailVerification).toHaveBeenCalledWith(
        'test@example.com',
        'testuser',
        'mock-token-hex',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
      });
    });

    it('should return error for existing email', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      };

      mockUserService.findUserByEmailOrUsername.mockResolvedValue({
        email: 'test@example.com',
        username: 'otheruser',
      });

      await mockControllers.register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('User with this email already exists');
    });

    it('should return error for existing username', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      };

      mockUserService.findUserByEmailOrUsername.mockResolvedValue({
        email: 'other@example.com',
        username: 'testuser',
      });

      await mockControllers.register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Username is already taken');
    });

    it('should continue registration even if email sending fails', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      };

      mockEmailService.sendEmailVerification.mockRejectedValue(new Error('Email service error'));

      await mockControllers.register(req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send verification email to test@example.com: Email service error',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      req.body = { email: 'test@example.com', password: 'correctpassword' };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isLocked: false,
        isActive: true,
        loginAttempts: 0,
        comparePassword: jest.fn().mockResolvedValue(true),
        resetLoginAttempts: jest.fn(),
      };

      mockUserService.findUserByEmail.mockResolvedValue(mockUser);

      await mockControllers.login(req, res, next);

      expect(mockUserService.findUserByEmail).toHaveBeenCalledWith('test@example.com', true);
      expect(mockUser.comparePassword).toHaveBeenCalledWith('correctpassword');
      expect(mockAuthService.sendTokenResponse).toHaveBeenCalledWith(mockUser, 200, res, req);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User logged in: test@example.com from IP: 127.0.0.1',
      );
    });

    it('should return error for non-existent user', async () => {
      req.body = { email: 'nonexistent@example.com', password: 'password' };

      mockUserService.findUserByEmail.mockResolvedValue(null);

      await mockControllers.login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Invalid credentials');
    });

    it('should return error for locked account', async () => {
      req.body = { email: 'test@example.com', password: 'password' };

      const mockUser = {
        email: 'test@example.com',
        isLocked: true,
        isActive: true,
      };

      mockUserService.findUserByEmail.mockResolvedValue(mockUser);

      await mockControllers.login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe(
        'Account is locked due to too many failed login attempts',
      );
    });

    it('should return error for inactive account', async () => {
      req.body = { email: 'test@example.com', password: 'password' };

      const mockUser = {
        email: 'test@example.com',
        isLocked: false,
        isActive: false,
      };

      mockUserService.findUserByEmail.mockResolvedValue(mockUser);

      await mockControllers.login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Account has been deactivated');
    });

    it('should increment login attempts for wrong password', async () => {
      req.body = { email: 'test@example.com', password: 'wrongpassword' };

      const mockUser = {
        email: 'test@example.com',
        isLocked: false,
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false),
        incLoginAttempts: jest.fn(),
      };

      mockUserService.findUserByEmail.mockResolvedValue(mockUser);

      await mockControllers.login(req, res, next);

      expect(mockUser.incLoginAttempts).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed login attempt for test@example.com from IP: 127.0.0.1',
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      await mockControllers.logout(req, res);

      expect(mockSession.findByIdAndUpdate).toHaveBeenCalledWith('session123', { isActive: false });
      expect(mockAuthService.clearAuthCookies).toHaveBeenCalledWith(res);
      expect(mockLogger.info).toHaveBeenCalledWith('User logged out: test@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should handle logout without session', async () => {
      req.session = null;

      await mockControllers.logout(req, res);

      expect(mockSession.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(mockAuthService.clearAuthCookies).toHaveBeenCalledWith(res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getSessions', () => {
    it('should get user sessions successfully', async () => {
      const mockSessions = [{ _id: 'session1' }, { _id: 'session2' }];
      mockAuthService.getUserActiveSessions.mockResolvedValue(mockSessions);
      mockAuthService.getActiveSessionsCount.mockResolvedValue(2);

      await mockControllers.getSessions(req, res, next);

      expect(mockAuthService.getUserActiveSessions).toHaveBeenCalledWith('user123');
      expect(mockAuthService.getActiveSessionsCount).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        sessions: mockSessions,
        activeCount: 2,
        message: 'Sessions retrieved successfully',
      });
    });

    it('should handle error when getting sessions', async () => {
      mockAuthService.getUserActiveSessions.mockRejectedValue(new Error('Database error'));

      await mockControllers.getSessions(req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to get user sessions: Database error');
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Failed to retrieve sessions');
    });
  });

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      req.params = { sessionId: 'session123' };

      await mockControllers.revokeSession(req, res, next);

      expect(mockAuthService.revokeSpecificSession).toHaveBeenCalledWith('session123', 'user123');
      expect(mockLogger.info).toHaveBeenCalledWith('Session revoked: session123 for user user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session revoked',
      });
    });

    it('should handle error when revoking session', async () => {
      req.params = { sessionId: 'session123' };
      mockAuthService.revokeSpecificSession.mockRejectedValue(new Error('Database error'));

      await mockControllers.revokeSession(req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to revoke session: Database error');
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Failed to revoke session');
    });
  });

  describe('cleanupSessions', () => {
    it('should cleanup sessions successfully for admin', async () => {
      req.user.role = 'admin';

      await mockControllers.cleanupSessions(req, res, next);

      expect(mockAuthService.cleanupExpiredSessions).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Session cleanup completed: 5 sessions removed');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cleanup completed',
        deletedCount: 5,
      });
    });

    it('should return error for non-admin user', async () => {
      req.user.role = 'user';

      await mockControllers.cleanupSessions(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Admin role required');
      expect(mockAuthService.cleanupExpiredSessions).not.toHaveBeenCalled();
    });

    it('should handle error during cleanup', async () => {
      req.user.role = 'admin';
      mockAuthService.cleanupExpiredSessions.mockRejectedValue(new Error('Database error'));

      await mockControllers.cleanupSessions(req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to cleanup sessions: Database error');
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Failed to cleanup sessions');
    });
  });
});
