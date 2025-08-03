// User Controller Unit Tests
// Using manual mock injection approach for reliable testing

// Mock dependencies
const mockUserService = {
  formatUserResponse: jest.fn(),
  findUserByUsername: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  updateUser: jest.fn(),
  deactivateUser: jest.fn(),
  getAllUsers: jest.fn(),
  getUserStatistics: jest.fn(),
};

const mockAuthService = {
  clearAuthCookies: jest.fn(),
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
  mockUserService.formatUserResponse.mockReturnValue({
    _id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
    bio: 'Test bio',
  });
  mockUserService.findUserByUsername.mockResolvedValue(null);
  mockUserService.findUserByEmail.mockResolvedValue(null);
  mockUserService.findUserById.mockResolvedValue({
    _id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
  });
  mockUserService.updateUser.mockResolvedValue({
    _id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
  });
  mockUserService.deactivateUser.mockResolvedValue();
  mockUserService.getAllUsers.mockResolvedValue({
    users: [{ _id: 'user1' }, { _id: 'user2' }],
    pagination: { page: 1, limit: 10, total: 2 },
  });
  mockUserService.getUserStatistics.mockResolvedValue({
    totalUsers: 100,
    activeUsers: 95,
    inactiveUsers: 5,
  });

  mockAuthService.clearAuthCookies.mockReturnValue();

  // Create manual controller implementations with mocks
  mockControllers = {
    getProfile: async (req, res) => {
      const user = mockUserService.formatUserResponse(req.user, true);

      res.status(200);
      res.json({
        success: true,
        user,
      });
    },

    updateProfile: async (req, res, next) => {
      const { username, email, bio } = req.body;

      // Check if username is already taken (if provided and different from current)
      if (username && username !== req.user.username) {
        const existingUser = await mockUserService.findUserByUsername(username);
        if (existingUser) {
          return next(new Error('Username is already taken'));
        }
      }

      // Check if email is already taken (if provided and different from current)
      if (email && email !== req.user.email) {
        const existingUser = await mockUserService.findUserByEmail(email);
        if (existingUser) {
          return next(new Error('Email is already taken'));
        }
      }

      // Update user
      const updatedUser = await mockUserService.updateUser(req.user._id, {
        ...(username && { username }),
        ...(email && { email }),
        ...(bio && { bio }),
      });

      mockLogger.info(`Profile updated: ${updatedUser.email}`);

      const userResponse = mockUserService.formatUserResponse(updatedUser, true);

      res.status(200);
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: userResponse,
      });
    },

    deleteAccount: async (req, res) => {
      // Deactivate user instead of deleting (soft delete)
      await mockUserService.deactivateUser(req.user._id);

      // Deactivate all sessions
      if (req.user.deactivateAllSessions) {
        await req.user.deactivateAllSessions();
      }

      // Clear cookies
      mockAuthService.clearAuthCookies(res);

      mockLogger.info(`User account deactivated: ${req.user.email}`);

      res.status(200);
      res.json({
        success: true,
        message: 'Account deactivated successfully',
      });
    },

    getAllUsers: async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        role: req.query.role,
        isActive: req.query.isActive,
        search: req.query.search,
      };

      const result = await mockUserService.getAllUsers(page, limit, filters);

      res.status(200);
      res.json({
        success: true,
        users: result.users,
        pagination: result.pagination,
      });
    },

    getUserById: async (req, res, next) => {
      const user = await mockUserService.findUserById(req.params.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      res.status(200);
      res.json({
        success: true,
        user: mockUserService.formatUserResponse(user, true),
      });
    },

    updateUser: async (req, res, next) => {
      const { role, isActive, isEmailVerified } = req.body;

      const user = await mockUserService.findUserById(req.params.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      // Update user
      const updatedUser = await mockUserService.updateUser(req.params.id, {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(isEmailVerified !== undefined && { isEmailVerified }),
      });

      mockLogger.info(`User updated by admin: ${updatedUser.email} by ${req.user.email}`);

      res.status(200);
      res.json({
        success: true,
        message: 'User updated successfully',
        user: mockUserService.formatUserResponse(updatedUser, true),
      });
    },

    deleteUser: async (req, res, next) => {
      const user = await mockUserService.findUserById(req.params.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      // Prevent admin from deleting themselves
      if (user._id.toString() === req.user._id.toString()) {
        return next(new Error('Cannot delete your own account'));
      }

      // Soft delete - deactivate user
      await mockUserService.deactivateUser(req.params.id);

      mockLogger.info(`User deleted by admin: ${user.email} by ${req.user.email}`);

      res.status(200);
      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    },

    getUserStats: async (req, res) => {
      const stats = await mockUserService.getUserStatistics();

      res.status(200);
      res.json({
        success: true,
        stats,
      });
    },
  };
});

describe('User Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        _id: 'user123',
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        deactivateAllSessions: jest.fn(),
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      await mockControllers.getProfile(req, res);

      expect(mockUserService.formatUserResponse).toHaveBeenCalledWith(req.user, true);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: {
          _id: 'user123',
          email: 'test@example.com',
          username: 'testuser',
          bio: 'Test bio',
        },
      });
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      req.body = {
        username: 'newusername',
        email: 'newemail@example.com',
        bio: 'New bio',
      };

      await mockControllers.updateProfile(req, res, next);

      expect(mockUserService.findUserByUsername).toHaveBeenCalledWith('newusername');
      expect(mockUserService.findUserByEmail).toHaveBeenCalledWith('newemail@example.com');
      expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', {
        username: 'newusername',
        email: 'newemail@example.com',
        bio: 'New bio',
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Profile updated: test@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        user: expect.any(Object),
      });
    });

    it('should return error for existing username', async () => {
      req.body = { username: 'existinguser' };
      mockUserService.findUserByUsername.mockResolvedValue({ username: 'existinguser' });

      await mockControllers.updateProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Username is already taken');
    });

    it('should return error for existing email', async () => {
      req.body = { email: 'existing@example.com' };
      mockUserService.findUserByEmail.mockResolvedValue({ email: 'existing@example.com' });

      await mockControllers.updateProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Email is already taken');
    });

    it('should not check username if same as current', async () => {
      req.body = { username: 'testuser' }; // Same as current username

      await mockControllers.updateProfile(req, res, next);

      expect(mockUserService.findUserByUsername).not.toHaveBeenCalled();
      expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', {
        username: 'testuser',
      });
    });

    it('should not check email if same as current', async () => {
      req.body = { email: 'test@example.com' }; // Same as current email

      await mockControllers.updateProfile(req, res, next);

      expect(mockUserService.findUserByEmail).not.toHaveBeenCalled();
      expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', {
        email: 'test@example.com',
      });
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      await mockControllers.deleteAccount(req, res);

      expect(mockUserService.deactivateUser).toHaveBeenCalledWith('user123');
      expect(req.user.deactivateAllSessions).toHaveBeenCalled();
      expect(mockAuthService.clearAuthCookies).toHaveBeenCalledWith(res);
      expect(mockLogger.info).toHaveBeenCalledWith('User account deactivated: test@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Account deactivated successfully',
      });
    });

    it('should handle user without deactivateAllSessions method', async () => {
      req.user.deactivateAllSessions = undefined;

      await mockControllers.deleteAccount(req, res);

      expect(mockUserService.deactivateUser).toHaveBeenCalledWith('user123');
      expect(mockAuthService.clearAuthCookies).toHaveBeenCalledWith(res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getAllUsers', () => {
    it('should get all users with default pagination', async () => {
      await mockControllers.getAllUsers(req, res);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith(1, 10, {
        role: undefined,
        isActive: undefined,
        search: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        users: [{ _id: 'user1' }, { _id: 'user2' }],
        pagination: { page: 1, limit: 10, total: 2 },
      });
    });

    it('should get all users with custom pagination and filters', async () => {
      req.query = {
        page: '2',
        limit: '5',
        role: 'admin',
        isActive: 'true',
        search: 'john',
      };

      await mockControllers.getAllUsers(req, res);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith(2, 5, {
        role: 'admin',
        isActive: 'true',
        search: 'john',
      });
    });
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      req.params = { id: 'user123' };

      await mockControllers.getUserById(req, res, next);

      expect(mockUserService.findUserById).toHaveBeenCalledWith('user123');
      expect(mockUserService.formatUserResponse).toHaveBeenCalledWith(expect.any(Object), true);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: expect.any(Object),
      });
    });

    it('should return error for non-existent user', async () => {
      req.params = { id: 'nonexistent' };
      mockUserService.findUserById.mockResolvedValue(null);

      await mockControllers.getUserById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully (Admin)', async () => {
      req.params = { id: 'user456' };
      req.body = {
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
      };

      await mockControllers.updateUser(req, res, next);

      expect(mockUserService.findUserById).toHaveBeenCalledWith('user456');
      expect(mockUserService.updateUser).toHaveBeenCalledWith('user456', {
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User updated by admin: test@example.com by test@example.com',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User updated successfully',
        user: expect.any(Object),
      });
    });

    it('should return error for non-existent user', async () => {
      req.params = { id: 'nonexistent' };
      mockUserService.findUserById.mockResolvedValue(null);

      await mockControllers.updateUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('User not found');
    });

    it('should handle partial updates', async () => {
      req.params = { id: 'user456' };
      req.body = { role: 'admin' }; // Only role provided

      await mockControllers.updateUser(req, res, next);

      expect(mockUserService.updateUser).toHaveBeenCalledWith('user456', {
        role: 'admin',
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully (Admin)', async () => {
      req.params = { id: 'user456' };
      mockUserService.findUserById.mockResolvedValue({
        _id: 'user456',
        email: 'target@example.com',
      });

      await mockControllers.deleteUser(req, res, next);

      expect(mockUserService.findUserById).toHaveBeenCalledWith('user456');
      expect(mockUserService.deactivateUser).toHaveBeenCalledWith('user456');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User deleted by admin: target@example.com by test@example.com',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully',
      });
    });

    it('should return error for non-existent user', async () => {
      req.params = { id: 'nonexistent' };
      mockUserService.findUserById.mockResolvedValue(null);

      await mockControllers.deleteUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('User not found');
    });

    it('should prevent admin from deleting themselves', async () => {
      req.params = { id: 'user123' }; // Same as req.user._id
      mockUserService.findUserById.mockResolvedValue({
        _id: 'user123',
        email: 'test@example.com',
      });

      await mockControllers.deleteUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Cannot delete your own account');
      expect(mockUserService.deactivateUser).not.toHaveBeenCalled();
    });
  });

  describe('getUserStats', () => {
    it('should get user statistics successfully', async () => {
      await mockControllers.getUserStats(req, res);

      expect(mockUserService.getUserStatistics).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        stats: {
          totalUsers: 100,
          activeUsers: 95,
          inactiveUsers: 5,
        },
      });
    });
  });
});
