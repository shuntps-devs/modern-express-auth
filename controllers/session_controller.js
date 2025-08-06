import { authService } from '../services/index.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/index.js';
import { logger } from '../config/index.js';
import {
  formatSessionResponse,
  getSessionSecurityLevel,
  sendErrorResponse,
  sendSuccessResponse,
  sendSessionResponse,
} from '../utils/index.js';
import { asyncHandler } from '../middleware/index.js';

// @desc    Get current user's active sessions with device and location info
// @route   GET /api/sessions/active
// @access  Private
export const getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getUserActiveSessions(req.user.id);

  const enrichedSessions = sessions.map(session => ({
    ...formatSessionResponse(session, true),
    securityLevel: getSessionSecurityLevel(session),
  }));

  return sendSessionResponse(res, SUCCESS_MESSAGES.USER_SESSIONS_RETRIEVED, enrichedSessions);
});

// @desc    Get detailed information about a specific session
// @route   GET /api/sessions/:sessionId
// @access  Private
export const getSessionDetails = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  const session = await authService.getSessionById(sessionId, userId);

  if (!session) {
    return sendErrorResponse(res, 404, ERROR_MESSAGES.SESSION_NOT_FOUND);
  }

  const sessionDetails = {
    ...formatSessionResponse(session, true),
    securityLevel: getSessionSecurityLevel(session),
    isCurrentSession: session._id.toString() === req.sessionId,
  };

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.SESSION_RETRIEVED, {
    session: sessionDetails,
  });
});

// @desc    Get session statistics grouped by device type
// @route   GET /api/sessions/stats/devices
// @access  Private
export const getDeviceStats = asyncHandler(async (req, res) => {
  const sessions = await authService.getUserActiveSessions(req.user.id);

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

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.DEVICE_STATS_RETRIEVED, deviceStats);
});

// @desc    Get session statistics grouped by location
// @route   GET /api/sessions/stats/locations
// @access  Private
export const getLocationStats = asyncHandler(async (req, res) => {
  const sessions = await authService.getUserActiveSessions(req.user.id);

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

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.LOCATION_STATS_RETRIEVED, locationStats);
});

// @desc    Get security overview of all sessions
// @route   GET /api/sessions/security-overview
// @access  Private
export const getSecurityOverview = asyncHandler(async (req, res) => {
  const sessions = await authService.getUserActiveSessions(req.user.id);

  const securityOverview = sessions.reduce(
    (overview, session) => {
      const securityLevel = getSessionSecurityLevel(session);

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

  return sendSuccessResponse(
    res,
    200,
    SUCCESS_MESSAGES.SECURITY_OVERVIEW_RETRIEVED,
    securityOverview,
  );
});

// @desc    Terminate a specific session (logout from specific device)
// @route   DELETE /api/sessions/:sessionId
// @access  Private
export const terminateSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  if (sessionId === req.sessionId) {
    return sendErrorResponse(res, 400, ERROR_MESSAGES.CANNOT_TERMINATE_CURRENT_SESSION);
  }

  const result = await authService.terminateSession(sessionId, userId);

  if (!result) {
    return sendErrorResponse(res, 404, ERROR_MESSAGES.SESSION_NOT_FOUND);
  }

  logger.warn(`Session terminated: ${sessionId} by user ${req.user.email} from IP: ${req.ip}`);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.SESSION_TERMINATED);
});

// @desc    Terminate all other sessions except current one
// @route   DELETE /api/sessions/terminate-others
// @access  Private
export const terminateOtherSessions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const currentSessionId = req.sessionId;

  const terminatedCount = await authService.terminateOtherSessions(userId, currentSessionId);

  logger.warn(`All other sessions terminated: ${terminatedCount} sessions by user ${req.user.email} from IP: ${req.ip}`);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.OTHER_SESSIONS_TERMINATED, {
    terminatedSessions: terminatedCount,
  });
});
