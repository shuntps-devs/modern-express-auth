import { asyncHandler, AppError } from '../middleware/error_handler.js';
import { logger } from '../config/logger_config.js';
import authService from '../services/auth_service.js';
import userService from '../services/user_service.js';
import Session from '../models/session_model.js';
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  LOGGER_MESSAGES,
  USER_ROLES,
} from '../constants/messages.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  // Check if user already exists
  const existingUser = await userService.findUserByEmailOrUsername(email, username);

  if (existingUser) {
    if (existingUser.email === email) {
      return next(new AppError(ERROR_MESSAGES.USER_EMAIL_EXISTS, 400));
    }
    if (existingUser.username === username) {
      return next(new AppError(ERROR_MESSAGES.USERNAME_TAKEN, 400));
    }
  }

  // Create user
  const user = await userService.createUser({
    username,
    email,
    password,
  });

  logger.info(`${LOGGER_MESSAGES.NEW_USER_REGISTERED} ${user.email}`);

  res.status(201).json({
    success: true,
    message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check for user
  const user = await userService.findUserByEmail(email, true); // include password

  if (!user) {
    return next(new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(new AppError(ERROR_MESSAGES.ACCOUNT_LOCKED, 423));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError(ERROR_MESSAGES.ACCOUNT_DEACTIVATED, 401));
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    // Increment login attempts
    await user.incLoginAttempts();
    logger.warn(`${LOGGER_MESSAGES.FAILED_LOGIN_ATTEMPT} ${email} from IP: ${req.ip}`);
    return next(new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, 401));
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  logger.info(`${LOGGER_MESSAGES.USER_LOGGED_IN} ${user.email} from IP: ${req.ip}`);

  await authService.sendTokenResponse(user, 200, res, req);
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  // Use session from auth middleware (req.session is set by protect middleware)
  if (req.session && req.session._id) {
    // Deactivate the current session using Session model
    await Session.findByIdAndUpdate(req.session._id, { isActive: false });
  }

  // Clear cookies
  authService.clearAuthCookies(res);

  logger.info(`${LOGGER_MESSAGES.USER_LOGGED_OUT} ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
  });
});

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
export const logoutAll = asyncHandler(async (req, res) => {
  // Deactivate all sessions
  await req.user.deactivateAllSessions();

  // Clear cookies
  authService.clearAuthCookies(res);

  logger.info(`${LOGGER_MESSAGES.USER_LOGGED_OUT_ALL_DEVICES} ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.LOGOUT_ALL_SUCCESS,
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = userService.formatUserResponse(req.user);

  res.status(200).json({
    success: true,
    user,
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await userService.findUserById(req.user._id, true);

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return next(new AppError(ERROR_MESSAGES.CURRENT_PASSWORD_INCORRECT, 400));
  }

  // Update password
  await userService.updateUserPassword(user._id, newPassword);

  logger.info(`${LOGGER_MESSAGES.PASSWORD_CHANGED} ${user.email}`);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.PASSWORD_UPDATE_SUCCESS,
  });
});

// @desc    Get user sessions
// @route   GET /api/auth/sessions
// @access  Private
export const getSessions = asyncHandler(async (req, res) => {
  // Get active sessions for the user from Session model
  const sessions = await Session.find({
    userId: req.user._id,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ lastActivity: -1 });

  const formattedSessions = authService.formatUserSessions(sessions, req.cookies.sessionId);

  res.status(200).json({
    success: true,
    sessions: formattedSessions,
  });
});

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  let refreshToken;

  // Extract refresh token from cookies or body
  if (req.cookies && req.cookies.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  } else if (req.body && req.body.refreshToken) {
    refreshToken = req.body.refreshToken;
  }

  if (!refreshToken) {
    throw new AppError(ERROR_MESSAGES.REFRESH_TOKEN_REQUIRED, 401);
  }

  try {
    await authService.handleTokenRefresh(refreshToken, req, res);
  } catch (error) {
    logger.error(LOGGER_MESSAGES.TOKEN_REFRESH_FAILED, error.message);
    throw new AppError(ERROR_MESSAGES.TOKEN_REFRESH_FAILED, 401);
  }
});

// @desc    Verify access token validity
// @route   GET /api/auth/verify
// @access  Private
export const verifyToken = asyncHandler(async (req, res) => {
  // If we reach here, the token is valid (middleware already validated it)
  const user = userService.formatUserResponse(req.user);

  res.status(200).json({
    success: true,
    valid: true,
    user,
    session: {
      _id: req.session._id,
      lastActivity: req.session.lastActivity,
      expiresAt: req.session.expiresAt,
    },
  });
});

// @desc    Check authentication status
// @route   GET /api/auth/status
// @access  Public (with optional auth)
export const getAuthStatus = asyncHandler(async (req, res) => {
  const isAuthenticated = !!req.user;

  res.status(200).json({
    success: true,
    isAuthenticated,
    user: isAuthenticated ? userService.formatUserResponse(req.user) : null,
  });
});

// ===== ENHANCED SESSION MANAGEMENT ENDPOINTS =====

// @desc    Get user active sessions
// @route   GET /api/auth/sessions
// @access  Private
export const getUserSessions = asyncHandler(async (req, res, next) => {
  try {
    const sessions = await authService.getUserActiveSessions(req.user.id);
    const activeCount = await authService.getActiveSessionsCount(req.user.id);

    res.status(200).json({
      success: true,
      sessions,
      activeCount,
      message: SUCCESS_MESSAGES.SESSIONS_RETRIEVED_SUCCESS,
    });
  } catch (error) {
    logger.error(LOGGER_MESSAGES.FAILED_TO_GET_USER_SESSIONS, error.message);
    return next(new AppError(ERROR_MESSAGES.FAILED_TO_RETRIEVE_SESSIONS, 500));
  }
});

// @desc    Revoke specific session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
export const revokeSession = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.params;

  try {
    const result = await authService.revokeSpecificSession(sessionId, req.user.id);

    logger.info(`${LOGGER_MESSAGES.SESSION_REVOKED} ${sessionId} ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error(LOGGER_MESSAGES.FAILED_TO_REVOKE_SESSION, error.message);
    return next(new AppError(ERROR_MESSAGES.FAILED_TO_REVOKE_SESSION, 500));
  }
});

// @desc    Revoke all user sessions except current
// @route   POST /api/auth/revoke-all
// @access  Private
export const revokeAllSessions = asyncHandler(async (req, res, next) => {
  const currentSessionId = req.cookies.sessionId;

  try {
    const result = await authService.revokeAllUserSessions(req.user.id, currentSessionId);

    logger.info(`${LOGGER_MESSAGES.ALL_SESSIONS_REVOKED} ${req.user.id}, except current session`);

    res.status(200).json({
      success: true,
      message: result.message,
      revokedCount: result.modifiedCount,
    });
  } catch (error) {
    logger.error(LOGGER_MESSAGES.FAILED_TO_REVOKE_ALL_SESSIONS, error.message);
    return next(new AppError(ERROR_MESSAGES.FAILED_TO_REVOKE_SESSIONS, 500));
  }
});

// @desc    Cleanup expired sessions
// @route   POST /api/auth/cleanup
// @access  Private (Admin only)
export const cleanupSessions = asyncHandler(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== USER_ROLES.ADMIN) {
    return next(new AppError(ERROR_MESSAGES.ADMIN_ROLE_REQUIRED, 403));
  }

  try {
    const result = await authService.cleanupExpiredSessions();

    logger.info(
      `${LOGGER_MESSAGES.SESSION_CLEANUP_COMPLETED} ${result.deletedCount} sessions removed`,
    );

    res.status(200).json({
      success: true,
      message: result.message,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    logger.error(LOGGER_MESSAGES.FAILED_TO_CLEANUP_SESSIONS, error.message);
    return next(new AppError(ERROR_MESSAGES.FAILED_TO_CLEANUP_SESSIONS, 500));
  }
});
