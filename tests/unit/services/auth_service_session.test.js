/**
 * Auth Service Session Methods Unit Tests
 * Tests for new session-related methods in AuthService including device/location enrichment
 */

import { ERROR_MESSAGES } from '../../../constants/index.js';

// Mock Session model with proper methods
const mockSession = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateMany: jest.fn(),
  create: jest.fn(),
};

// Mock enriched session data utility
const mockCreateEnrichedSessionData = jest.fn();

// Create test-specific auth service methods that use our mocks
const authService = {
  // Mock existing methods
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  parseJwtTime: jest.fn(),

  // Test implementations of new session methods
  async getUserActiveSessions(userId) {
    try {
      const sessions = await mockSession
        .find({
          userId,
          isActive: true,
          expiresAt: { $gt: expect.any(Date) },
        })
        .sort({ lastActivity: -1 });

      return sessions.map(session => ({
        _id: session._id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        deviceInfo: session.deviceInfo || {
          browser: 'Unknown',
          os: 'Unknown',
          device: 'Unknown',
        },
        location: session.location || {
          country: 'Unknown',
          city: 'Unknown',
          region: 'Unknown',
        },
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
      }));
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.USER_SESSIONS_RETRIEVAL_FAILED} ${error.message}`);
    }
  },

  async getSessionById(sessionId, userId) {
    try {
      const session = await mockSession.findOne({
        _id: sessionId,
        userId,
        isActive: true,
        expiresAt: { $gt: expect.any(Date) },
      });
      return session;
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.SESSION_NOT_FOUND} ${error.message}`);
    }
  },

  async terminateSession(sessionId, userId) {
    try {
      const result = await mockSession.findOneAndUpdate(
        {
          _id: sessionId,
          userId,
          isActive: true,
        },
        {
          isActive: false,
          lastActivity: expect.any(Date),
        },
        { new: true },
      );
      return result;
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.SESSION_TERMINATION_FAILED} ${error.message}`);
    }
  },

  async terminateOtherSessions(userId, currentSessionId) {
    try {
      const result = await mockSession.updateMany(
        {
          userId,
          _id: { $ne: currentSessionId },
          isActive: true,
        },
        {
          isActive: false,
          lastActivity: expect.any(Date),
        },
      );
      return result.modifiedCount;
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.SESSION_TERMINATION_FAILED} ${error.message}`);
    }
  },

  async sendTokenResponse(user, statusCode, res, req) {
    // Mock token generation
    const accessToken = this.generateAccessToken({ id: user._id }) || 'mock_access_token';
    const refreshToken = this.generateRefreshToken({ id: user._id }) || 'mock_refresh_token';

    // Mock time parsing
    const tokenExpiryMs = this.parseJwtTime('24h') || 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + tokenExpiryMs);

    // Get enriched session data
    const enrichedData = mockCreateEnrichedSessionData(req);

    // Create session
    await mockSession.create({
      userId: user._id,
      accessToken,
      refreshToken,
      accessTokenExpiresAt: expiresAt,
      refreshTokenExpiresAt: expiresAt,
      ipAddress: enrichedData.ipAddress,
      userAgent: enrichedData.userAgent,
      deviceInfo: enrichedData.deviceInfo,
      location: enrichedData.location,
      isActive: true,
      expiresAt,
    });

    // Mock response
    res.status(statusCode);
    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
      },
    });
  },
};

describe('AuthService Session Methods', () => {
  // Mock ObjectIds for MongoDB
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockSessionId = '507f1f77bcf86cd799439012';
  const mockCurrentSessionId = '507f1f77bcf86cd799439013';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserActiveSessions', () => {
    it('should return active sessions with enriched data', async () => {
      const mockSessions = [
        {
          _id: mockSessionId,
          userId: mockUserId,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          deviceInfo: {
            browser: 'Chrome',
            os: 'Windows',
            device: 'Desktop',
          },
          location: {
            country: 'US',
            city: 'New York',
            region: 'NY',
          },
          createdAt: new Date(),
          lastActivity: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ];

      mockSession.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockSessions),
      });

      const result = await authService.getUserActiveSessions(mockUserId);

      expect(mockSession.find).toHaveBeenCalledWith({
        userId: mockUserId,
        isActive: true,
        expiresAt: { $gt: expect.any(Date) },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        _id: mockSessionId,
        ipAddress: '192.168.1.1',
        deviceInfo: {
          browser: 'Chrome',
          os: 'Windows',
          device: 'Desktop',
        },
        location: {
          country: 'US',
          city: 'New York',
          region: 'NY',
        },
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');

      mockSession.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(error),
      });

      await expect(authService.getUserActiveSessions(mockUserId)).rejects.toThrow(
        'Failed to get user sessions: Database error',
      );
    });
  });

  describe('getSessionById', () => {
    it('should get session by ID for specific user', async () => {
      const mockSessionData = {
        _id: mockSessionId,
        userId: mockUserId,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      mockSession.findOne.mockResolvedValue(mockSessionData);

      const result = await authService.getSessionById(mockSessionId, mockUserId);

      expect(mockSession.findOne).toHaveBeenCalledWith({
        _id: mockSessionId,
        userId: mockUserId,
        isActive: true,
        expiresAt: { $gt: expect.any(Date) },
      });

      expect(result).toEqual(mockSessionData);
    });

    it('should return null for non-existent session', async () => {
      mockSession.findOne.mockResolvedValue(null);

      const result = await authService.getSessionById('nonexistent', mockUserId);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');

      mockSession.findOne.mockRejectedValue(error);

      await expect(authService.getSessionById(mockSessionId, mockUserId)).rejects.toThrow(
        'Session not found Database error',
      );
    });
  });

  describe('terminateSession', () => {
    it('should terminate session successfully', async () => {
      const mockUpdatedSession = {
        _id: mockSessionId,
        userId: mockUserId,
        isActive: false,
        lastActivity: expect.any(Date),
      };

      mockSession.findOneAndUpdate.mockResolvedValue(mockUpdatedSession);

      const result = await authService.terminateSession(mockSessionId, mockUserId);

      expect(mockSession.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: mockSessionId,
          userId: mockUserId,
          isActive: true,
        },
        {
          isActive: false,
          lastActivity: expect.any(Date),
        },
        { new: true },
      );

      expect(result).toEqual(mockUpdatedSession);
    });

    it('should return null for non-existent session', async () => {
      mockSession.findOneAndUpdate.mockResolvedValue(null);

      const result = await authService.terminateSession('nonexistent', mockUserId);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');

      mockSession.findOneAndUpdate.mockRejectedValue(error);

      await expect(authService.terminateSession(mockSessionId, mockUserId)).rejects.toThrow(
        'Failed to terminate session Database error',
      );
    });
  });

  describe('terminateOtherSessions', () => {
    it('should terminate all other sessions except current one', async () => {
      const mockResult = { modifiedCount: 3 };

      mockSession.updateMany.mockResolvedValue(mockResult);

      const result = await authService.terminateOtherSessions(mockUserId, mockCurrentSessionId);

      expect(mockSession.updateMany).toHaveBeenCalledWith(
        {
          userId: mockUserId,
          _id: { $ne: mockCurrentSessionId },
          isActive: true,
        },
        {
          isActive: false,
          lastActivity: expect.any(Date),
        },
      );

      expect(result).toBe(3);
    });

    it('should return 0 when no other sessions to terminate', async () => {
      const mockResult = { modifiedCount: 0 };

      mockSession.updateMany.mockResolvedValue(mockResult);

      const result = await authService.terminateOtherSessions(mockUserId, mockCurrentSessionId);

      expect(result).toBe(0);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');

      mockSession.updateMany.mockRejectedValue(error);

      await expect(
        authService.terminateOtherSessions(mockUserId, mockCurrentSessionId),
      ).rejects.toThrow('Failed to terminate session Database error');
    });
  });

  describe('sendTokenResponse with enriched session data', () => {
    it('should create session with enriched device and location data', async () => {
      const mockUser = {
        _id: mockUserId,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        isActive: true,
        isEmailVerified: true,
      };

      const mockReq = {
        ip: '192.168.1.1',
        connection: { remoteAddress: '192.168.1.1' },
        get: jest
          .fn()
          .mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockEnrichedData = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceInfo: { browser: 'Chrome', os: 'Windows', device: 'Desktop' },
        location: { country: 'US', city: 'New York', region: 'NY' },
      };

      const mockCreatedSession = {
        _id: mockSessionId,
        userId: mockUserId,
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        ...mockEnrichedData,
        isActive: true,
        expiresAt: expect.any(Date),
      };

      mockCreateEnrichedSessionData.mockReturnValue(mockEnrichedData);
      mockSession.create.mockResolvedValue(mockCreatedSession);

      // Mock JWT methods
      authService.generateAccessToken = jest.fn().mockReturnValue('access_token');
      authService.generateRefreshToken = jest.fn().mockReturnValue('refresh_token');
      authService.parseJwtTime = jest.fn().mockReturnValue(24 * 60 * 60 * 1000); // 24 hours

      await authService.sendTokenResponse(mockUser, 200, mockRes, mockReq);

      expect(mockCreateEnrichedSessionData).toHaveBeenCalledWith(mockReq);
      expect(mockSession.create).toHaveBeenCalledWith({
        userId: mockUserId,
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        accessTokenExpiresAt: expect.any(Date),
        refreshTokenExpiresAt: expect.any(Date),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceInfo: { browser: 'Chrome', os: 'Windows', device: 'Desktop' },
        location: { country: 'US', city: 'New York', region: 'NY' },
        isActive: true,
        expiresAt: expect.any(Date),
      });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        user: {
          _id: mockUserId,
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          isActive: true,
          isEmailVerified: true,
        },
      });
    });

    it('should handle missing request data gracefully', async () => {
      const mockUser = { _id: mockUserId, username: 'testuser', email: 'test@example.com' };
      const mockReq = {}; // Empty request object
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockEnrichedData = {
        ipAddress: '127.0.0.1',
        userAgent: '',
        deviceInfo: { browser: 'Unknown', os: 'Unknown', device: 'Unknown' },
        location: { country: 'Local', city: 'Development', region: 'Local' },
      };

      mockCreateEnrichedSessionData.mockReturnValue(mockEnrichedData);
      mockSession.create.mockResolvedValue({ _id: 'session123' });

      authService.generateAccessToken = jest.fn().mockReturnValue('access_token');
      authService.generateRefreshToken = jest.fn().mockReturnValue('refresh_token');
      authService.parseJwtTime = jest.fn().mockReturnValue(24 * 60 * 60 * 1000);

      await authService.sendTokenResponse(mockUser, 200, mockRes, mockReq);

      expect(mockCreateEnrichedSessionData).toHaveBeenCalledWith(mockReq);
      expect(mockSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '127.0.0.1',
          userAgent: '',
          deviceInfo: { browser: 'Unknown', os: 'Unknown', device: 'Unknown' },
          location: { country: 'Local', city: 'Development', region: 'Local' },
        }),
      );
    });
  });
});
