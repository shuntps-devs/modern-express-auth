import { authService } from '../../../services/index.js';
import { Session } from '../../../models/index.js';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/index.js';
import { DatabaseHelpers, MockHelpers, AssertionHelpers } from '../../helpers/test_helpers.js';
import { ERROR_MESSAGES } from '../../../constants/index.js';

describe('authService', () => {
  let testUser;
  let mockReq;
  let mockRes;

  beforeEach(async () => {
    // Create test user
    testUser = await DatabaseHelpers.createTestUser();

    // Create mock request and response
    mockReq = MockHelpers.createMockRequest();
    mockRes = MockHelpers.createMockResponse();
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
      await authService.sendTokenResponse(testUser, 200, mockRes, mockReq);

      // Check response
      AssertionHelpers.expectSuccessResponse(mockRes, 200, {
        user: expect.objectContaining({
          _id: testUser._id,
          username: testUser.username,
          email: testUser.email,
          role: testUser.role,
        }),
      });

      // Check session was created
      const session = await Session.findOne({ userId: testUser._id });
      AssertionHelpers.expectValidSession(session, {
        userId: testUser._id,
        isActive: true,
      });
    });

    test('should set authentication cookies', async () => {
      await authService.sendTokenResponse(testUser, 200, mockRes, mockReq);

      // Verify cookies were set (mocked)
      expect(mockRes.cookie).toHaveBeenCalled();
    });

    test('should not include sensitive data in response', async () => {
      await authService.sendTokenResponse(testUser, 200, mockRes, mockReq);

      const responseCall = mockRes.json.mock.calls[0][0];
      expect(responseCall.user.password).toBeUndefined();
      expect(responseCall.accessToken).toBeUndefined();
      expect(responseCall.refreshToken).toBeUndefined();
    });
  });

  describe('validateAccessToken', () => {
    test('should validate valid access token and return session', async () => {
      const { user, session } = await DatabaseHelpers.createTestUserWithSession();

      const result = await authService.validateAccessToken(session.accessToken);

      expect(result.session._id.toString()).toBe(session._id.toString());
      expect(result.user._id.toString()).toBe(user._id.toString());
    });

    test('should throw error for non-existent token', async () => {
      await expect(authService.validateAccessToken('non-existent-token')).rejects.toThrow(
        ERROR_MESSAGES.TOKEN_VALIDATION_FAILED,
      );
    });

    test('should throw error for inactive session', async () => {
      const { session } = await DatabaseHelpers.createTestUserWithSession({}, { isActive: false });

      await expect(authService.validateAccessToken(session.accessToken)).rejects.toThrow(
        ERROR_MESSAGES.TOKEN_VALIDATION_FAILED,
      );
    });
  });

  describe('cleanupExpiredSessions', () => {
    test('should remove expired sessions', async () => {
      // Create expired session
      await DatabaseHelpers.createTestSession(testUser._id, {
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      // Create active session
      await DatabaseHelpers.createTestSession(testUser._id, {
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // Expires in 1 hour
      });

      const result = await authService.cleanupExpiredSessions();

      expect(result.deletedCount).toBe(1);

      // Verify only active session remains
      const remainingSessions = await Session.find({ userId: testUser._id });
      expect(remainingSessions).toHaveLength(1);
      expect(remainingSessions[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    test('should cleanup sessions for specific user', async () => {
      const otherUser = await DatabaseHelpers.createTestUser({
        username: 'otheruser',
        email: 'other@example.com',
      });

      // Create expired sessions for both users
      await DatabaseHelpers.createTestSession(testUser._id, {
        expiresAt: new Date(Date.now() - 1000),
      });
      await DatabaseHelpers.createTestSession(otherUser._id, {
        expiresAt: new Date(Date.now() - 1000),
      });

      const result = await authService.cleanupExpiredSessions(testUser._id);

      expect(result.deletedCount).toBe(1);

      // Verify other user's session still exists
      const otherUserSessions = await Session.find({ userId: otherUser._id });
      expect(otherUserSessions).toHaveLength(1);
    });
  });

  describe('revokeAllUserSessions', () => {
    test('should revoke all active sessions for user', async () => {
      // Create multiple active sessions
      await DatabaseHelpers.createTestSession(testUser._id, { isActive: true });
      await DatabaseHelpers.createTestSession(testUser._id, { isActive: true });

      const result = await authService.revokeAllUserSessions(testUser._id);

      expect(result.modifiedCount).toBe(2);

      // Verify all sessions are inactive
      const sessions = await Session.find({ userId: testUser._id });
      sessions.forEach(session => {
        expect(session.isActive).toBe(false);
        // Session model doesn't have deactivatedAt field, just check isActive
      });
    });

    test('should exclude specific session from revocation', async () => {
      const session1 = await DatabaseHelpers.createTestSession(testUser._id, { isActive: true });
      const session2 = await DatabaseHelpers.createTestSession(testUser._id, { isActive: true });

      const result = await authService.revokeAllUserSessions(testUser._id, session1._id);

      expect(result.modifiedCount).toBe(1);

      // Verify session1 is still active, session2 is inactive
      const updatedSession1 = await Session.findById(session1._id);
      const updatedSession2 = await Session.findById(session2._id);

      expect(updatedSession1.isActive).toBe(true);
      expect(updatedSession2.isActive).toBe(false);
    });
  });

  describe('getActiveSessionsCount', () => {
    test('should return correct count of active sessions', async () => {
      // Create active and inactive sessions
      await DatabaseHelpers.createTestSession(testUser._id, { isActive: true });
      await DatabaseHelpers.createTestSession(testUser._id, { isActive: true });
      await DatabaseHelpers.createTestSession(testUser._id, { isActive: false });

      const count = await authService.getActiveSessionsCount(testUser._id);

      expect(count).toBe(2);
    });

    test('should not count expired sessions', async () => {
      await DatabaseHelpers.createTestSession(testUser._id, {
        isActive: true,
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      const count = await authService.getActiveSessionsCount(testUser._id);

      expect(count).toBe(0);
    });
  });
});
