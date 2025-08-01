import User from '../../models/user_model.js';
import Session from '../../models/session_model.js';
import Profile from '../../models/profile_model.js';
import AuthService from '../../services/auth_service.js';

/**
 * Test Data Factory
 * Creates consistent test data for all tests
 */
export class TestDataFactory {
  static createUserData(overrides = {}) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    return {
      username: `testuser${randomSuffix}`,
      email: `test${randomSuffix}@example.com`,
      password: 'Test123!@#',
      role: 'user',
      isActive: true,
      isEmailVerified: false,
      ...overrides,
    };
  }

  static createAdminData(overrides = {}) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return this.createUserData({
      username: `adminuser${randomSuffix}`,
      email: `admin${randomSuffix}@example.com`,
      role: 'admin',
      isEmailVerified: true,
      ...overrides,
    });
  }

  static createProfileData(userId, overrides = {}) {
    return {
      userId,
      bio: 'Test user bio',
      preferences: {
        twoFactorAuth: {
          isEnabled: false,
        },
      },
      ...overrides,
    };
  }

  static createSessionData(userId, overrides = {}) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);

    return {
      userId,
      accessToken: `test-access-token-${timestamp}-${randomSuffix}`,
      refreshToken: `test-refresh-token-${timestamp}-${randomSuffix}`,
      accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: '::ffff:127.0.0.1',
      userAgent: 'Test User Agent',
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      ...overrides,
    };
  }
}

/**
 * Database Test Helpers
 * Provides utilities for database operations in tests
 */
export class DatabaseHelpers {
  static async createTestUser(userData = {}) {
    const userInfo = TestDataFactory.createUserData(userData);

    // Let the User model's pre-save middleware handle password hashing
    const user = await User.create(userInfo);
    return user;
  }

  static async createTestUserWithProfile(userData = {}, profileData = {}) {
    const user = await this.createTestUser(userData);
    const profile = await Profile.create(TestDataFactory.createProfileData(user._id, profileData));

    return { user, profile };
  }

  static async createTestSession(userId, sessionData = {}) {
    const sessionInfo = TestDataFactory.createSessionData(userId, sessionData);
    const session = await Session.create(sessionInfo);
    return session;
  }

  static async createTestUserWithSession(userData = {}, sessionData = {}) {
    const user = await this.createTestUser(userData);

    // Generate real JWT tokens using AuthService (same payload format as sendTokenResponse)
    const accessToken = AuthService.generateAccessToken({ id: user._id });
    const refreshToken = AuthService.generateRefreshToken({ id: user._id });

    // Calculate expiration times using hardcoded test values (same as env defaults)
    const accessTokenExpiryMs = 15 * 60 * 1000; // 15 minutes
    const refreshTokenExpiryMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    const sessionExpiryMs = 30 * 24 * 60 * 60 * 1000; // 30 days

    const accessTokenExpiresAt = new Date(Date.now() + accessTokenExpiryMs);
    const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenExpiryMs);
    const sessionExpiresAt = new Date(Date.now() + sessionExpiryMs);

    // Create session with real tokens and proper expiration dates
    const sessionInfo = {
      userId: user._id,
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      ipAddress: '::ffff:127.0.0.1',
      userAgent: 'Test User Agent',
      isActive: true,
      expiresAt: sessionExpiresAt,
      ...sessionData,
    };

    const session = await Session.create(sessionInfo);

    return { user, session, accessToken, refreshToken };
  }

  static async clearAllCollections() {
    await User.deleteMany({});
    await Session.deleteMany({});
    await Profile.deleteMany({});
  }
}

/**
 * Mock Helpers
 * Provides mock objects for testing
 */
export class MockHelpers {
  static createMockRequest(overrides = {}) {
    return {
      body: {},
      params: {},
      query: {},
      headers: {},
      cookies: {},
      ip: '127.0.0.1',
      get: jest.fn(header => {
        const headers = {
          'User-Agent': 'Test User Agent',
          ...overrides.headers,
        };
        return headers[header];
      }),
      connection: {
        remoteAddress: '127.0.0.1',
      },
      ...overrides,
    };
  }

  static createMockResponse() {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    return res;
  }

  static createMockNext() {
    return jest.fn();
  }
}

/**
 * Assertion Helpers
 * Custom assertions for common test patterns
 */
export class AssertionHelpers {
  static expectValidUser(user, expectedData = {}) {
    expect(user).toBeDefined();
    expect(user._id).toBeDefined();
    expect(user.username).toBeDefined();
    expect(user.email).toBeDefined();
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();

    // Check expected data if provided
    Object.keys(expectedData).forEach(key => {
      expect(user[key]).toEqual(expectedData[key]);
    });
  }

  static expectValidSession(session, expectedData = {}) {
    expect(session).toBeDefined();
    expect(session._id).toBeDefined();
    expect(session.userId).toBeDefined();
    expect(session.accessToken).toBeDefined();
    expect(session.refreshToken).toBeDefined();
    expect(session.isActive).toBeDefined();
    expect(session.createdAt).toBeDefined();

    // Check expected data if provided
    Object.keys(expectedData).forEach(key => {
      expect(session[key]).toEqual(expectedData[key]);
    });
  }

  static expectValidJWT(token) {
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  }

  static expectErrorResponse(response, statusCode, message) {
    expect(response.status).toHaveBeenCalledWith(statusCode);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining(message),
      }),
    );
  }

  static expectSuccessResponse(response, statusCode, data = {}) {
    expect(response.status).toHaveBeenCalledWith(statusCode);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        ...data,
      }),
    );
  }
}
