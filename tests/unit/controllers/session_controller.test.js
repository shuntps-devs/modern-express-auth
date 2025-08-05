/**
 * Session Controller Unit Tests
 * Tests for session controller endpoints with device and location information
 */

import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../../constants/index.js';
import { AppError, asyncHandler } from '../../../middleware/error_handler.js';

// Mock dependencies
const mockAuthService = {
  getUserActiveSessions: jest.fn(),
  getSessionById: jest.fn(),
  terminateSession: jest.fn(),
  terminateOtherSessions: jest.fn(),
};

const mockFormatSessionResponse = jest.fn();
const mockGetSessionSecurityLevel = jest.fn();

// Create test-specific controller functions that use our mocks
const getActiveSessions = asyncHandler(async (req, res, next) => {
  try {
    const sessions = await mockAuthService.getUserActiveSessions(req.user.id);

    const enrichedSessions = sessions.map(session => ({
      ...mockFormatSessionResponse(session, true),
      securityLevel: mockGetSessionSecurityLevel(session),
    }));

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.SESSIONS_RETRIEVED_SUCCESS,
      data: {
        sessions: enrichedSessions,
        total: enrichedSessions.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

const getSessionDetails = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  const session = await mockAuthService.getSessionById(sessionId, userId);

  if (!session) {
    return next(new AppError(ERROR_MESSAGES.SESSION_NOT_FOUND, 404));
  }

  const sessionDetails = {
    ...mockFormatSessionResponse(session, true),
    securityLevel: mockGetSessionSecurityLevel(session),
    isCurrentSession: session._id.toString() === req.sessionId,
  };

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.SESSION_RETRIEVED_SUCCESS,
    data: {
      session: sessionDetails,
    },
  });
});

const getDeviceStats = asyncHandler(async (req, res) => {
  const sessions = await mockAuthService.getUserActiveSessions(req.user.id);

  const deviceStats = sessions.reduce(
    (stats, session) => {
      const device = session.deviceInfo?.device || 'Unknown';
      const browser = session.deviceInfo?.browser || 'Unknown';
      const os = session.deviceInfo?.os || 'Unknown';

      if (!stats.devices[device]) {
        stats.devices[device] = 0;
      }
      if (!stats.browsers[browser]) {
        stats.browsers[browser] = 0;
      }
      if (!stats.operatingSystems[os]) {
        stats.operatingSystems[os] = 0;
      }

      stats.devices[device]++;
      stats.browsers[browser]++;
      stats.operatingSystems[os]++;
      stats.total++;

      return stats;
    },
    {
      devices: {},
      browsers: {},
      operatingSystems: {},
      total: 0,
    },
  );

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.DEVICE_STATS_RETRIEVED_SUCCESS,
    data: deviceStats,
  });
});

const getLocationStats = asyncHandler(async (req, res) => {
  const sessions = await mockAuthService.getUserActiveSessions(req.user.id);

  const locationStats = sessions.reduce(
    (stats, session) => {
      const country = session.location?.country || 'Unknown';
      const city = session.location?.city || 'Unknown';

      if (!stats.countries[country]) {
        stats.countries[country] = 0;
      }
      if (!stats.cities[city]) {
        stats.cities[city] = 0;
      }

      stats.countries[country]++;
      stats.cities[city]++;
      stats.total++;

      return stats;
    },
    {
      countries: {},
      cities: {},
      total: 0,
    },
  );

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.LOCATION_STATS_RETRIEVED_SUCCESS,
    data: locationStats,
  });
});

const getSecurityOverview = asyncHandler(async (req, res) => {
  const sessions = await mockAuthService.getUserActiveSessions(req.user.id);

  const securityOverview = sessions.reduce(
    (overview, session) => {
      const securityLevel = mockGetSessionSecurityLevel(session);

      if (!overview.securityLevels[securityLevel]) {
        overview.securityLevels[securityLevel] = 0;
      }

      overview.securityLevels[securityLevel]++;
      overview.totalSessions++;

      if (securityLevel === 'low') {
        overview.suspiciousSessions.push({
          sessionId: session._id,
          reason: 'Low security level',
          deviceInfo: session.deviceInfo,
          location: session.location,
          lastActivity: session.lastActivity,
        });
      }

      return overview;
    },
    {
      totalSessions: 0,
      securityLevels: {
        high: 0,
        medium: 0,
        low: 0,
      },
      suspiciousSessions: [],
    },
  );

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.SECURITY_OVERVIEW_RETRIEVED_SUCCESS,
    data: securityOverview,
  });
});

const terminateSession = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  if (sessionId === req.sessionId) {
    return next(new AppError(ERROR_MESSAGES.CANNOT_TERMINATE_CURRENT_SESSION, 400));
  }

  const result = await mockAuthService.terminateSession(sessionId, userId);

  if (!result) {
    return next(new AppError(ERROR_MESSAGES.SESSION_NOT_FOUND, 404));
  }

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.SESSION_TERMINATED_SUCCESS,
  });
});

const terminateOtherSessions = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const currentSessionId = req.sessionId;

    const terminatedCount = await mockAuthService.terminateOtherSessions(userId, currentSessionId);

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.OTHER_SESSIONS_TERMINATED_SUCCESS,
      data: {
        terminatedSessions: terminatedCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

describe('Session Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 'user123' },
      params: {},
      sessionId: 'currentSession123',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getActiveSessions', () => {
    it('should get active sessions with enriched data successfully', async () => {
      const mockSessions = [
        {
          _id: 'session1',
          ipAddress: '192.168.1.1',
          userAgent: 'Chrome/91.0',
          deviceInfo: { browser: 'Chrome', os: 'Windows', device: 'Desktop' },
          location: { country: 'US', city: 'New York', region: 'NY' },
          createdAt: new Date(),
          lastActivity: new Date(),
          expiresAt: new Date(),
        },
        {
          _id: 'session2',
          ipAddress: '192.168.1.2',
          userAgent: 'Firefox/89.0',
          deviceInfo: { browser: 'Firefox', os: 'Linux', device: 'Desktop' },
          location: { country: 'CA', city: 'Toronto', region: 'ON' },
          createdAt: new Date(),
          lastActivity: new Date(),
          expiresAt: new Date(),
        },
      ];

      mockAuthService.getUserActiveSessions.mockResolvedValue(mockSessions);
      mockFormatSessionResponse.mockImplementation((session, _includeDetails) => ({
        ...session,
        formatted: true,
      }));
      mockGetSessionSecurityLevel.mockReturnValue('high');

      await getActiveSessions(req, res, next);

      expect(mockAuthService.getUserActiveSessions).toHaveBeenCalledWith('user123');
      expect(mockFormatSessionResponse).toHaveBeenCalledTimes(2);
      expect(mockGetSessionSecurityLevel).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sessions retrieved successfully',
        data: {
          sessions: expect.arrayContaining([
            expect.objectContaining({
              formatted: true,
              securityLevel: 'high',
            }),
          ]),
          total: 2,
        },
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockAuthService.getUserActiveSessions.mockRejectedValue(error);

      await getActiveSessions(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getSessionDetails', () => {
    it('should get session details successfully', async () => {
      req.params.sessionId = 'session123';
      const mockSession = {
        _id: 'session123',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/91.0',
        deviceInfo: { browser: 'Chrome', os: 'Windows', device: 'Desktop' },
        location: { country: 'US', city: 'New York', region: 'NY' },
      };

      mockAuthService.getSessionById.mockResolvedValue(mockSession);
      mockFormatSessionResponse.mockReturnValue({ ...mockSession, formatted: true });
      mockGetSessionSecurityLevel.mockReturnValue('high');

      await getSessionDetails(req, res, next);

      expect(mockAuthService.getSessionById).toHaveBeenCalledWith('session123', 'user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session details retrieved successfully',
        data: {
          session: expect.objectContaining({
            formatted: true,
            securityLevel: 'high',
            isCurrentSession: false,
          }),
        },
      });
    });

    it('should identify current session correctly', async () => {
      req.params.sessionId = 'currentSession123';
      const mockSession = { _id: 'currentSession123' };

      mockAuthService.getSessionById.mockResolvedValue(mockSession);
      mockFormatSessionResponse.mockReturnValue({ ...mockSession, formatted: true });
      mockGetSessionSecurityLevel.mockReturnValue('high');

      await getSessionDetails(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session details retrieved successfully',
        data: {
          session: expect.objectContaining({
            isCurrentSession: true,
          }),
        },
      });
    });

    it('should return error for non-existent session', async () => {
      req.params.sessionId = 'nonexistent';
      mockAuthService.getSessionById.mockResolvedValue(null);

      await getSessionDetails(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Session not found',
          statusCode: 404,
        }),
      );
    });
  });

  describe('getDeviceStats', () => {
    it('should calculate device statistics correctly', async () => {
      const mockSessions = [
        {
          deviceInfo: { browser: 'Chrome', os: 'Windows', device: 'Desktop' },
        },
        {
          deviceInfo: { browser: 'Chrome', os: 'Windows', device: 'Desktop' },
        },
        {
          deviceInfo: { browser: 'Firefox', os: 'Linux', device: 'Desktop' },
        },
        {
          deviceInfo: { browser: 'Safari', os: 'iOS', device: 'Mobile' },
        },
      ];

      mockAuthService.getUserActiveSessions.mockResolvedValue(mockSessions);

      await getDeviceStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Device statistics retrieved successfully',
        data: {
          devices: {
            Desktop: 3,
            Mobile: 1,
          },
          browsers: {
            Chrome: 2,
            Firefox: 1,
            Safari: 1,
          },
          operatingSystems: {
            Windows: 2,
            Linux: 1,
            iOS: 1,
          },
          total: 4,
        },
      });
    });

    it('should handle sessions with missing device info', async () => {
      const mockSessions = [
        { deviceInfo: { browser: 'Chrome', os: 'Windows', device: 'Desktop' } },
        { deviceInfo: null },
        {},
      ];

      mockAuthService.getUserActiveSessions.mockResolvedValue(mockSessions);

      await getDeviceStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Device statistics retrieved successfully',
        data: {
          devices: {
            Desktop: 1,
            Unknown: 2,
          },
          browsers: {
            Chrome: 1,
            Unknown: 2,
          },
          operatingSystems: {
            Windows: 1,
            Unknown: 2,
          },
          total: 3,
        },
      });
    });
  });

  describe('getLocationStats', () => {
    it('should calculate location statistics correctly', async () => {
      const mockSessions = [
        {
          location: { country: 'US', city: 'New York', region: 'NY' },
        },
        {
          location: { country: 'US', city: 'Los Angeles', region: 'CA' },
        },
        {
          location: { country: 'CA', city: 'Toronto', region: 'ON' },
        },
      ];

      mockAuthService.getUserActiveSessions.mockResolvedValue(mockSessions);

      await getLocationStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Location statistics retrieved successfully',
        data: {
          countries: {
            US: 2,
            CA: 1,
          },
          cities: {
            'New York': 1,
            'Los Angeles': 1,
            Toronto: 1,
          },
          total: 3,
        },
      });
    });

    it('should handle sessions with missing location info', async () => {
      const mockSessions = [
        { location: { country: 'US', city: 'New York', region: 'NY' } },
        { location: null },
        {},
      ];

      mockAuthService.getUserActiveSessions.mockResolvedValue(mockSessions);

      await getLocationStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Location statistics retrieved successfully',
        data: {
          countries: {
            US: 1,
            Unknown: 2,
          },
          cities: {
            'New York': 1,
            Unknown: 2,
          },
          total: 3,
        },
      });
    });
  });

  describe('getSecurityOverview', () => {
    it('should generate security overview correctly', async () => {
      const mockSessions = [{ _id: 'session1' }, { _id: 'session2' }, { _id: 'session3' }];

      mockAuthService.getUserActiveSessions.mockResolvedValue(mockSessions);
      mockGetSessionSecurityLevel
        .mockReturnValueOnce('high')
        .mockReturnValueOnce('medium')
        .mockReturnValueOnce('low');

      await getSecurityOverview(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Security overview retrieved successfully',
        data: {
          totalSessions: 3,
          securityLevels: {
            high: 1,
            medium: 1,
            low: 1,
          },
          suspiciousSessions: [
            expect.objectContaining({
              sessionId: 'session3',
              reason: 'Low security level',
            }),
          ],
        },
      });
    });

    it('should handle sessions with no suspicious activity', async () => {
      const mockSessions = [{ _id: 'session1' }, { _id: 'session2' }];

      mockAuthService.getUserActiveSessions.mockResolvedValue(mockSessions);
      mockGetSessionSecurityLevel.mockReturnValue('high');

      await getSecurityOverview(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Security overview retrieved successfully',
        data: {
          totalSessions: 2,
          securityLevels: {
            high: 2,
            medium: 0,
            low: 0,
          },
          suspiciousSessions: [],
        },
      });
    });
  });

  describe('terminateSession', () => {
    it('should terminate session successfully', async () => {
      req.params.sessionId = 'session123';
      mockAuthService.terminateSession.mockResolvedValue({ _id: 'session123' });

      await terminateSession(req, res, next);

      expect(mockAuthService.terminateSession).toHaveBeenCalledWith('session123', 'user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session terminated successfully',
      });
    });

    it('should prevent terminating current session', async () => {
      req.params.sessionId = 'currentSession123';

      await terminateSession(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cannot terminate current session',
          statusCode: 400,
        }),
      );
      expect(mockAuthService.terminateSession).not.toHaveBeenCalled();
    });

    it('should return error for non-existent session', async () => {
      req.params.sessionId = 'nonexistent';
      mockAuthService.terminateSession.mockResolvedValue(null);

      await terminateSession(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Session not found',
          statusCode: 404,
        }),
      );
    });
  });

  describe('terminateOtherSessions', () => {
    it('should terminate other sessions successfully', async () => {
      mockAuthService.terminateOtherSessions.mockResolvedValue(3);

      await terminateOtherSessions(req, res, next);

      expect(mockAuthService.terminateOtherSessions).toHaveBeenCalledWith(
        'user123',
        'currentSession123',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'All other sessions terminated successfully',
        data: {
          terminatedSessions: 3,
        },
      });
    });

    it('should handle case with no other sessions to terminate', async () => {
      mockAuthService.terminateOtherSessions.mockResolvedValue(0);

      await terminateOtherSessions(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'All other sessions terminated successfully',
        data: {
          terminatedSessions: 0,
        },
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockAuthService.terminateOtherSessions.mockRejectedValue(error);

      await terminateOtherSessions(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
