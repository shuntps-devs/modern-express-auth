import { userService } from '../../../services/index.js';
import bcrypt from 'bcryptjs';

// Mock helpers for testing (removed as not used in simplified tests)

describe('userService', () => {
  let testUser;

  beforeEach(() => {
    // Create mock test user
    testUser = {
      _id: 'user123',
      email: 'test@example.com',
      username: 'testuser',
      password: '$2b$10$hashedpassword',
      role: 'user',
      isActive: true,
      isEmailVerified: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('formatUserResponse', () => {
    test('should format basic user response', () => {
      const formatted = userService.formatUserResponse(testUser);

      expect(formatted).toEqual({
        _id: testUser._id,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role,
        isActive: testUser.isActive,
        isEmailVerified: testUser.isEmailVerified,
        avatar: null, // Avatar field added to user response
        createdAt: testUser.createdAt,
      });

      // Should not include sensitive data
      expect(formatted.password).toBeUndefined();
    });

    test('should include additional details when requested', () => {
      const formatted = userService.formatUserResponse(testUser, true);

      // Check that additional details are included
      expect(formatted.updatedAt).toBeDefined();
      // lastLogin may be undefined if user never logged in, so we just check it's included in response
      expect('lastLogin' in formatted).toBe(true);
    });
  });

  describe('password hashing utilities', () => {
    test('should hash passwords correctly', async () => {
      const plainPassword = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/);

      // Should be able to verify the password
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect passwords', async () => {
      const plainPassword = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('service method existence', () => {
    test('should have all expected methods', () => {
      // Test that all expected methods exist on the service
      expect(typeof userService.findUserByEmail).toBe('function');
      expect(typeof userService.findUserByUsername).toBe('function');
      expect(typeof userService.findUserById).toBe('function');
      expect(typeof userService.createUser).toBe('function');
      expect(typeof userService.updateUser).toBe('function');
      expect(typeof userService.updateUserPassword).toBe('function');
      expect(typeof userService.getAllUsers).toBe('function');
      expect(typeof userService.getUserStatistics).toBe('function');
      expect(typeof userService.formatUserResponse).toBe('function');
      expect(typeof userService.userExists).toBe('function');
      expect(typeof userService.validateCredentials).toBe('function');
    });
  });
});
