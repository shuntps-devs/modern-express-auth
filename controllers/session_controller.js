/**
 * Session Controller
 * Handles session-related operations with device and location information
 */

import { authService } from '../services/index.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/index.js';
import { formatSessionResponse, getSessionSecurityLevel } from '../utils/index.js';
import { asyncHandler } from '../middleware/index.js';
import { AppError } from '../middleware/index.js';

/**
 * Get current user's active sessions with device and location info
 * @route GET /api/sessions/active
 * @access Private
 */
export const getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getUserActiveSessions(req.user.id);

  // Enrich sessions with security levels
  const enrichedSessions = sessions.map(session => ({
    ...formatSessionResponse(session, true),
    securityLevel: getSessionSecurityLevel(session),
  }));

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.USER_SESSIONS_RETRIEVED,
    data: {
      sessions: enrichedSessions,
      total: enrichedSessions.length,
    },
  });
});

/**
 * Get detailed information about a specific session
 * @route GET /api/sessions/:sessionId
 * @access Private
 */
export const getSessionDetails = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  const session = await authService.getSessionById(sessionId, userId);

  if (!session) {
    return next(new AppError(ERROR_MESSAGES.SESSION_NOT_FOUND, 404));
  }

  const sessionDetails = {
    ...formatSessionResponse(session, true),
    securityLevel: getSessionSecurityLevel(session),
    isCurrentSession: session._id.toString() === req.sessionId,
  };

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.SESSION_RETRIEVED,
    data: {
      session: sessionDetails,
    },
  });
});

/**
 * Get session statistics grouped by device type
 * @route GET /api/sessions/stats/devices
 * @access Private
 */
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

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.DEVICE_STATS_RETRIEVED,
    data: deviceStats,
  });
});

/**
 * Get session statistics grouped by location
 * @route GET /api/sessions/stats/locations
 * @access Private
 */
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

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.LOCATION_STATS_RETRIEVED,
    data: locationStats,
  });
});

/**
 * Get security overview of all sessions
 * @route GET /api/sessions/security-overview
 * @access Private
 */
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

      // Track suspicious patterns
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
    message: SUCCESS_MESSAGES.SECURITY_OVERVIEW_RETRIEVED,
    data: securityOverview,
  });
});

/**
 * Terminate a specific session (logout from specific device)
 * @route DELETE /api/sessions/:sessionId
 * @access Private
 */
export const terminateSession = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  // Prevent terminating current session
  if (sessionId === req.sessionId) {
    return next(new AppError(ERROR_MESSAGES.CANNOT_TERMINATE_CURRENT_SESSION, 400));
  }

  const result = await authService.terminateSession(sessionId, userId);

  if (!result) {
    return next(new AppError(ERROR_MESSAGES.SESSION_NOT_FOUND, 404));
  }

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.SESSION_TERMINATED,
  });
});

/**
 * Terminate all other sessions except current one
 * @route DELETE /api/sessions/terminate-others
 * @access Private
 */
export const terminateOtherSessions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const currentSessionId = req.sessionId;

  const terminatedCount = await authService.terminateOtherSessions(userId, currentSessionId);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.OTHER_SESSIONS_TERMINATED,
    data: {
      terminatedSessions: terminatedCount,
    },
  });
});
