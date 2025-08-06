import crypto from 'crypto';
import { logger } from '../config/index.js';
import { asyncHandler } from '../middleware/index.js';
import { userService, authService, emailService } from '../services/index.js';
import { Session } from '../models/index.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/index.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendUserResponse,
  validateAdminRole,
} from '../utils/index.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await userService.findUserByEmailOrUsername(email, username);

  if (existingUser) {
    if (existingUser.email === email) {
      return sendErrorResponse(res, 400, ERROR_MESSAGES.USER_EMAIL_EXISTS);
    }
    if (existingUser.username === username) {
      return sendErrorResponse(res, 400, ERROR_MESSAGES.USERNAME_TAKEN);
    }
  }

  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await userService.createUser({
    username,
    email,
    password,
    isEmailVerified: false,
    emailVerificationToken,
    emailVerificationExpires,
  });

  try {
    await emailService.sendEmailVerification(email, username, emailVerificationToken);
    logger.info(`Email verification sent to ${user.email}`);
  } catch (error) {
    logger.error(`Failed to send verification email to ${user.email}: ${error.message}`);
  }

  logger.info(`New user registered: ${user.email}`);

  return sendSuccessResponse(res, 201, SUCCESS_MESSAGES.REGISTRATION_SUCCESS);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await authService.login(email, password);

  logger.info(`User logged in: ${user.email} from IP: ${req.ip}`);

  await authService.sendTokenResponse(user, 200, res, req);
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  if (req.session && req.session._id) {
    await Session.findByIdAndUpdate(req.session._id, { isActive: false });
  }

  authService.clearAuthCookies(res);

  logger.info(`User logged out: ${req.user.email}`);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
});

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
export const logoutAll = asyncHandler(async (req, res) => {
  await req.user.deactivateAllSessions();

  authService.clearAuthCookies(res);

  logger.info(`User logged out from all devices: ${req.user.email}`);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.LOGOUT_ALL_SUCCESS);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = userService.formatUserResponse(req.user);

  return sendUserResponse(res, SUCCESS_MESSAGES.USER_PROFILE_RETRIEVED, user);
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await userService.findUserById(req.user._id, true);

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return sendErrorResponse(res, 400, ERROR_MESSAGES.CURRENT_PASSWORD_INCORRECT);
  }

  await userService.updateUserPassword(user._id, newPassword);

  logger.info(`Password changed for user: ${user.email}`);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.PASSWORD_UPDATE_SUCCESS);
});

// @desc    Get user sessions
// @route   GET /api/auth/sessions
// @access  Private
export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({
    userId: req.user._id,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ lastActivity: -1 });

  const formattedSessions = authService.formatUserSessions(sessions, req.cookies.sessionId);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.SESSIONS_RETRIEVED, {
    sessions: formattedSessions,
  });
});

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return sendErrorResponse(res, 401, ERROR_MESSAGES.REFRESH_TOKEN_REQUIRED);
  }

  await authService.handleTokenRefresh(refreshToken, req, res);
});

// @desc    Verify access token validity
// @route   GET /api/auth/verify
// @access  Private
export const verifyToken = asyncHandler(async (req, res) => {
  const user = userService.formatUserResponse(req.user);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.TOKEN_VERIFIED, {
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

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.AUTH_STATUS_RETRIEVED, {
    isAuthenticated,
    user: isAuthenticated ? userService.formatUserResponse(req.user) : null,
  });
});

// @desc    Get user active sessions
// @route   GET /api/auth/sessions
// @access  Private
export const getUserSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getUserActiveSessions(req.user.id);
  const activeCount = await authService.getActiveSessionsCount(req.user.id);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.SESSIONS_RETRIEVED_SUCCESS, {
    sessions,
    activeCount,
  });
});

// @desc    Revoke specific session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
export const revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const result = await authService.revokeSpecificSession(sessionId, req.user.id);

  logger.info(`Session revoked: ${sessionId} for user: ${req.user.id}`);

  return sendSuccessResponse(res, 200, result.message);
});

// @desc    Revoke all user sessions except current
// @route   POST /api/auth/revoke-all
// @access  Private
export const revokeAllSessions = asyncHandler(async (req, res) => {
  const currentSessionId = req.cookies.sessionId;

  const result = await authService.revokeAllUserSessions(req.user.id, currentSessionId);

  logger.info(`All sessions revoked for user: ${req.user.id}, except current session`);

  return sendSuccessResponse(res, 200, result.message, {
    revokedCount: result.modifiedCount,
  });
});

// @desc    Cleanup expired sessions
// @route   POST /api/auth/cleanup
// @access  Private (Admin only)
export const cleanupSessions = asyncHandler(async (req, res) => {
  validateAdminRole(req.user);

  const result = await authService.cleanupExpiredSessions();

  logger.info(`Session cleanup completed: ${result.deletedCount} sessions removed`);

  return sendSuccessResponse(res, 200, result.message, {
    deletedCount: result.deletedCount,
  });
});

// @desc    Get user security status (login attempts, lock status, last login)
// @route   GET /api/auth/security-status
// @access  Private
export const getSecurityStatus = asyncHandler(async (req, res) => {
  const securityStatus = await authService.getUserSecurityStatus(req.user._id);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.SECURITY_STATUS_RETRIEVED_SUCCESS, {
    data: securityStatus,
  });
});

// @desc    Reset user login attempts (Admin only)
// @route   POST /api/auth/reset-login-attempts/:userId
// @access  Private (Admin only)
export const resetLoginAttempts = asyncHandler(async (req, res) => {
  validateAdminRole(req.user);

  const { userId } = req.params;

  const result = await authService.resetUserLoginAttempts(userId);

  logger.info(`Admin ${req.user.email} reset login attempts for user ${userId}`);

  return sendSuccessResponse(res, 200, result.message, {
    userId: result.userId,
  });
});

// @desc    Check email verification status
// @route   GET /api/auth/email-status
// @access  Private
export const checkEmailStatus = asyncHandler(async (req, res) => {
  const user = await userService.findUserById(req.user._id);

  if (!user) {
    return sendErrorResponse(res, 404, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.EMAIL_STATUS_RETRIEVED, {
    isEmailVerified: user.isEmailVerified,
    email: user.email,
    emailVerificationExpires: user.emailVerificationExpires,
    canResendVerification:
      !user.emailVerificationExpires || new Date() > user.emailVerificationExpires,
  });
});
