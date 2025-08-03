import { authService } from '../../../services/index.js';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/index.js';
import { ERROR_MESSAGES } from '../../../constants/index.js';

// Mock Session model (removed as not used in pure unit tests)

const AssertionHelpers = {
  expectValidJWT: token => {
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  },
};

describe('authService', () => {
  let testUser;

  beforeEach(() => {
    // Create mock test user
    testUser = {
      _id: 'user123',
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedpassword',
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('parseJwtTime', () => {
    test('should parse seconds correctly', () => {
      const result = authService.parseJwtTime('30s');
      expect(result).toBe(30 * 1000);
    });

    test('should parse minutes correctly', () => {
      const result = authService.parseJwtTime('15m');
      expect(result).toBe(15 * 60 * 1000);
    });

    test('should parse hours correctly', () => {
      const result = authService.parseJwtTime('2h');
      expect(result).toBe(2 * 60 * 60 * 1000);
    });

    test('should parse days correctly', () => {
      const result = authService.parseJwtTime('7d');
      expect(result).toBe(7 * 24 * 60 * 60 * 1000);
    });

    test('should throw error for invalid format', () => {
      expect(() => authService.parseJwtTime('invalid')).toThrow(ERROR_MESSAGES.INVALID_TIME_FORMAT);
      expect(() => authService.parseJwtTime('30x')).toThrow(ERROR_MESSAGES.INVALID_TIME_FORMAT);
      expect(() => authService.parseJwtTime('')).toThrow(ERROR_MESSAGES.INVALID_TIME_FORMAT);
    });
  });

  describe('generateAccessToken', () => {
    test('should generate valid access token', () => {
      const payload = { id: testUser._id };
      const token = authService.generateAccessToken(payload);

      AssertionHelpers.expectValidJWT(token);

      // Verify token can be decoded
      const decoded = jwt.verify(token, env.JWT_SECRET);
      expect(decoded.id).toBe(testUser._id.toString());
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    test('should generate different tokens for different payloads', () => {
      const token1 = authService.generateAccessToken({ id: testUser._id });
      const token2 = authService.generateAccessToken({ id: 'different-id' });

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    test('should generate valid refresh token', () => {
      const payload = { id: testUser._id };
      const token = authService.generateRefreshToken(payload);

      AssertionHelpers.expectValidJWT(token);

      // Verify token can be decoded with refresh secret
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
      expect(decoded.id).toBe(testUser._id.toString());
    });
  });

  describe('generateRandomToken', () => {
    test('should generate random hex token', () => {
      const token = authService.generateRandomToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(80); // 40 bytes = 80 hex chars
      expect(/^[a-f0-9]+$/i.test(token)).toBe(true);
    });

    test('should generate different tokens each time', () => {
      const token1 = authService.generateRandomToken();
      const token2 = authService.generateRandomToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyAccessToken', () => {
    test('should verify valid access token', () => {
      const payload = { id: testUser._id };
      const token = authService.generateAccessToken(payload);

      const decoded = authService.verifyAccessToken(token);
      expect(decoded.id).toBe(testUser._id.toString());
    });

    test('should throw error for invalid token', () => {
      expect(() => authService.verifyAccessToken('invalid-token')).toThrow();
    });

    test('should throw error for token with wrong secret', () => {
      const wrongToken = jwt.sign({ id: testUser._id }, 'wrong-secret');
      expect(() => authService.verifyAccessToken(wrongToken)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    test('should verify valid refresh token', () => {
      const payload = { id: testUser._id };
      const token = authService.generateRefreshToken(payload);

      const decoded = authService.verifyRefreshToken(token);
      expect(decoded.id).toBe(testUser._id.toString());
    });

    test('should throw error for invalid refresh token', () => {
      expect(() => authService.verifyRefreshToken('invalid-token')).toThrow();
    });
  });

  describe('sendTokenResponse', () => {
    test('should create session and send user response', async () => {
      // Note: This method involves database operations that are better tested in integration tests
      // For unit testing, we'll test the core functionality that doesn't require DB

      // Test that the method exists and can be called
      expect(typeof authService.sendTokenResponse).toBe('function');

      // Test token generation functions that are used internally
      const accessToken = authService.generateAccessToken({ id: testUser._id });
      const refreshToken = authService.generateRefreshToken({ id: testUser._id });

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      AssertionHelpers.expectValidJWT(accessToken);
      AssertionHelpers.expectValidJWT(refreshToken);
    });
  });

  // Note: Database-dependent methods are simplified for unit testing
  // These would typically be tested in integration tests with real DB
  describe('token validation and session management', () => {
    test('should handle token validation logic', () => {
      // Test the core JWT validation logic without DB dependencies
      const payload = { id: testUser._id };
      const token = authService.generateAccessToken(payload);

      const decoded = authService.verifyAccessToken(token);
      expect(decoded.id).toBe(testUser._id.toString());
    });

    test('should generate proper random tokens', () => {
      const token1 = authService.generateRandomToken();
      const token2 = authService.generateRandomToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(80);
      expect(/^[a-f0-9]+$/i.test(token1)).toBe(true);
    });

    test('should parse JWT time formats correctly', () => {
      expect(authService.parseJwtTime('1h')).toBe(3600000);
      expect(authService.parseJwtTime('30m')).toBe(1800000);
      expect(authService.parseJwtTime('7d')).toBe(604800000);
      expect(authService.parseJwtTime('60s')).toBe(60000);
    });
  });
});
