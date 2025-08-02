import UserService from '../../../services/user_service.js';
import User from '../../../models/user_model.js';
import bcrypt from 'bcryptjs';
import { TestDataFactory, DatabaseHelpers, AssertionHelpers } from '../../helpers/test_helpers.js';

describe('UserService', () => {
  let testUser;
  let testUserData;

  beforeEach(async () => {
    testUserData = TestDataFactory.createUserData();
    testUser = await DatabaseHelpers.createTestUser(testUserData);
  });

  describe('findUserByEmail', () => {
    test('should find user by email', async () => {
      const foundUser = await UserService.findUserByEmail(testUser.email);

      AssertionHelpers.expectValidUser(foundUser, {
        email: testUser.email,
        username: testUser.username,
      });
    });

    test('should return null for non-existent email', async () => {
      const foundUser = await UserService.findUserByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });

    test('should include password when requested', async () => {
      const foundUser = await UserService.findUserByEmail(testUser.email, true);

      expect(foundUser.password).toBeDefined();
      expect(typeof foundUser.password).toBe('string');
    });

    test('should not include password by default', async () => {
      const foundUser = await UserService.findUserByEmail(testUser.email);
      // Password should be undefined because it's not selected by default
      expect(foundUser.password).toBeUndefined();
    });
  });

  describe('findUserByUsername', () => {
    test('should find user by username', async () => {
      const foundUser = await UserService.findUserByUsername(testUser.username);

      AssertionHelpers.expectValidUser(foundUser, {
        username: testUser.username,
        email: testUser.email,
      });
    });

    test('should return null for non-existent username', async () => {
      const foundUser = await UserService.findUserByUsername('nonexistent');
      expect(foundUser).toBeNull();
    });
  });

  describe('findUserByEmailOrUsername', () => {
    test('should find user by email', async () => {
      const foundUser = await UserService.findUserByEmailOrUsername(
        testUser.email,
        'different-username',
      );

      AssertionHelpers.expectValidUser(foundUser, {
        email: testUser.email,
      });
    });

    test('should find user by username', async () => {
      const foundUser = await UserService.findUserByEmailOrUsername(
        'different@email.com',
        testUser.username,
      );

      AssertionHelpers.expectValidUser(foundUser, {
        username: testUser.username,
      });
    });

    test('should return null when neither email nor username match', async () => {
      const foundUser = await UserService.findUserByEmailOrUsername(
        'nonexistent@example.com',
        'nonexistent',
      );

      expect(foundUser).toBeNull();
    });
  });

  describe('findUserById', () => {
    test('should find user by ID', async () => {
      const foundUser = await UserService.findUserById(testUser._id);

      AssertionHelpers.expectValidUser(foundUser, {
        _id: testUser._id,
        email: testUser.email,
        username: testUser.username,
      });
    });

    test('should return null for non-existent ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const foundUser = await UserService.findUserById(fakeId);
      expect(foundUser).toBeNull();
    });

    test('should include password when requested', async () => {
      const foundUser = await UserService.findUserById(testUser._id, true);
      expect(foundUser.password).toBeDefined();
    });
  });

  describe('findUserBySession', () => {
    test('should find user by active session', async () => {
      const { session } = await DatabaseHelpers.createTestUserWithSession();

      const foundUser = await UserService.findUserBySession(session._id);

      expect(foundUser).toBeDefined();
      expect(foundUser._id.toString()).toBe(session.userId.toString());
    });

    test('should return null for inactive session', async () => {
      const { session } = await DatabaseHelpers.createTestUserWithSession({}, { isActive: false });

      const foundUser = await UserService.findUserBySession(session._id);
      expect(foundUser).toBeNull();
    });

    test('should return null for expired session', async () => {
      const { session } = await DatabaseHelpers.createTestUserWithSession(
        {},
        { expiresAt: new Date(Date.now() - 1000) },
      );

      const foundUser = await UserService.findUserBySession(session._id);
      expect(foundUser).toBeNull();
    });

    test('should return null for non-existent session', async () => {
      const fakeSessionId = '507f1f77bcf86cd799439011';
      const foundUser = await UserService.findUserBySession(fakeSessionId);
      expect(foundUser).toBeNull();
    });
  });

  describe('createUser', () => {
    test('should create new user', async () => {
      const newUserData = TestDataFactory.createUserData({
        username: 'newuser',
        email: 'newuser@example.com',
      });

      const createdUser = await UserService.createUser(newUserData);

      AssertionHelpers.expectValidUser(createdUser, {
        username: newUserData.username,
        email: newUserData.email,
        role: newUserData.role,
      });

      // Verify user was saved to database
      const savedUser = await User.findById(createdUser._id);
      expect(savedUser).toBeDefined();
    });

    test('should hash password during creation', async () => {
      const newUserData = TestDataFactory.createUserData({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'plaintext-password',
      });

      const createdUser = await UserService.createUser(newUserData);

      // Password should be hashed
      expect(createdUser.password).not.toBe('plaintext-password');
      expect(createdUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });

  describe('updateUser', () => {
    test('should update user data', async () => {
      const updateData = {
        username: 'updateduser',
        role: 'admin',
      };

      const updatedUser = await UserService.updateUser(testUser._id, updateData);

      expect(updatedUser.username).toBe(updateData.username);
      expect(updatedUser.role).toBe(updateData.role);
      expect(updatedUser.email).toBe(testUser.email); // Should remain unchanged
    });

    test('should set updatedAt timestamp', async () => {
      const originalUpdatedAt = testUser.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedUser = await UserService.updateUser(testUser._id, {
        username: 'newusername',
      });

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    test('should return null for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const result = await UserService.updateUser(fakeId, { username: 'test' });
      expect(result).toBeNull();
    });
  });

  describe('updateUserPassword', () => {
    test('should update user password', async () => {
      const newPassword = 'NewPassword123!';

      const updatedUser = await UserService.updateUserPassword(testUser._id, newPassword);

      expect(updatedUser).toBeDefined();

      // Verify password was hashed and changed
      const userWithPassword = await User.findById(testUser._id).select('+password');
      expect(userWithPassword.password).not.toBe(newPassword);
      expect(userWithPassword.password).toMatch(/^\$2[aby]\$\d+\$/);

      // Verify new password works
      const isValid = await bcrypt.compare(newPassword, userWithPassword.password);
      expect(isValid).toBe(true);
    });
  });

  describe('deactivateUser', () => {
    test('should deactivate user', async () => {
      const deactivatedUser = await UserService.deactivateUser(testUser._id);

      expect(deactivatedUser.isActive).toBe(false);
      expect(deactivatedUser.updatedAt).toBeDefined();
    });

    test('should return null for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const result = await UserService.deactivateUser(fakeId);
      expect(result).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    beforeEach(async () => {
      // Create additional test users
      await DatabaseHelpers.createTestUser({
        username: 'user2',
        email: 'user2@example.com',
        role: 'admin',
      });
      await DatabaseHelpers.createTestUser({
        username: 'user3',
        email: 'user3@example.com',
        isActive: false,
      });
    });

    test('should return paginated users', async () => {
      const result = await UserService.getAllUsers(1, 2);

      expect(result.users).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        pages: 2,
      });
    });

    test('should filter by role', async () => {
      const result = await UserService.getAllUsers(1, 10, { role: 'admin' });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].role).toBe('admin');
    });

    test('should filter by active status', async () => {
      const result = await UserService.getAllUsers(1, 10, { isActive: 'false' });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].isActive).toBe(false);
    });

    test('should search by username and email', async () => {
      // Search for 'user2@example.com' which should only match the admin user
      const result = await UserService.getAllUsers(1, 10, { search: 'user2@example.com' });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].username).toBe('user2');
      expect(result.users[0].email).toBe('user2@example.com');
    });

    test('should not include sensitive data', async () => {
      const result = await UserService.getAllUsers();

      result.users.forEach(user => {
        expect(user.password).toBeUndefined();
        expect(user.sessions).toBeUndefined();
      });
    });
  });

  describe('getUserStatistics', () => {
    beforeEach(async () => {
      // Create users with different properties
      await DatabaseHelpers.createTestUser({
        username: 'admin1',
        email: 'admin1@example.com',
        role: 'admin',
        isEmailVerified: true,
      });
      await DatabaseHelpers.createTestUser({
        username: 'inactive1',
        email: 'inactive1@example.com',
        isActive: false,
      });
    });

    test('should return correct user statistics', async () => {
      const stats = await UserService.getUserStatistics();

      expect(stats.totalUsers).toBe(3);
      expect(stats.activeUsers).toBe(2);
      expect(stats.inactiveUsers).toBe(1);
      expect(stats.verifiedUsers).toBe(1);
      expect(stats.unverifiedUsers).toBe(2);
      expect(stats.usersByRole).toEqual(
        expect.arrayContaining([
          { _id: 'user', count: 2 },
          { _id: 'admin', count: 1 },
        ]),
      );
      expect(stats.recentRegistrations).toBe(3); // All created within 30 days
    });
  });

  describe('formatUserResponse', () => {
    test('should format basic user response', async () => {
      const formatted = UserService.formatUserResponse(testUser);

      expect(formatted).toEqual({
        _id: testUser._id,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role,
        isActive: testUser.isActive,
        isEmailVerified: testUser.isEmailVerified,
        createdAt: testUser.createdAt,
      });

      // Should not include sensitive data
      expect(formatted.password).toBeUndefined();
    });

    test('should include additional details when requested', async () => {
      const formatted = UserService.formatUserResponse(testUser, true);

      // Check that additional details are included
      expect(formatted.updatedAt).toBeDefined();
      // lastLogin may be undefined if user never logged in, so we just check it's included in response
      expect('lastLogin' in formatted).toBe(true);
    });
  });

  describe('userExists', () => {
    test('should return true for existing user', async () => {
      const exists = await UserService.userExists(testUser.email, testUser.username);
      expect(exists).toBe(true);
    });

    test('should return false for non-existing user', async () => {
      const exists = await UserService.userExists('nonexistent@example.com', 'nonexistent');
      expect(exists).toBe(false);
    });
  });

  describe('validateCredentials', () => {
    test('should validate correct credentials', async () => {
      // Create user with known password
      const plainPassword = 'TestPassword123!';
      const userWithPassword = await DatabaseHelpers.createTestUser({
        password: plainPassword, // This will be hashed by DatabaseHelpers
      });

      const validatedUser = await UserService.validateCredentials(
        userWithPassword.email,
        plainPassword,
      );

      expect(validatedUser).toBeDefined();
      expect(validatedUser).not.toBeNull();
      expect(validatedUser.email).toBe(userWithPassword.email);
    });

    test('should return null for incorrect password', async () => {
      const result = await UserService.validateCredentials(testUser.email, 'wrong-password');

      expect(result).toBeNull();
    });

    test('should return null for non-existent user', async () => {
      const result = await UserService.validateCredentials(
        'nonexistent@example.com',
        'any-password',
      );

      expect(result).toBeNull();
    });

    test('should return null for inactive user', async () => {
      const inactiveUser = await DatabaseHelpers.createTestUser({
        username: 'inactive',
        email: 'inactive@example.com',
        isActive: false,
      });

      const result = await UserService.validateCredentials(inactiveUser.email, 'any-password');

      expect(result).toBeNull();
    });

    test('should return null for locked user', async () => {
      const lockedUser = await DatabaseHelpers.createTestUser({
        username: 'locked',
        email: 'locked@example.com',
        lockUntil: new Date(Date.now() + 1000 * 60 * 60), // Locked for 1 hour
      });

      const result = await UserService.validateCredentials(lockedUser.email, 'any-password');

      expect(result).toBeNull();
    });
  });
});
