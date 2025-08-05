import crypto from 'crypto';
import { logger } from '../config/index.js';
import { AppError, asyncHandler } from '../middleware/index.js';
import { userService, authService, emailService } from '../services/index.js';
import { Session } from '../models/index.js';
import { ERROR_MESSAGES, LOGGER_MESSAGES, SUCCESS_MESSAGES } from '../constants/index.js';
import { sendSuccessResponse, sendUserResponse, validateAdminRole } from '../utils/index.js';

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

  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user with email verification fields
  const user = await userService.createUser({
    username,
    email,
    password,
    isEmailVerified: false,
    emailVerificationToken,
    emailVerificationExpires,
  });

  // Send verification email
  try {
    await emailService.sendEmailVerification(email, username, emailVerificationToken);
    logger.info(`Email verification sent to ${user.email}`);
  } catch (error) {
    logger.error(`Failed to send verification email to ${user.email}: ${error.message}`);
    // Continue with registration even if email fails
  }

  logger.info(`${LOGGER_MESSAGES.NEW_USER_REGISTERED} ${user.email}`);

  return sendSuccessResponse(res, 201, SUCCESS_MESSAGES.REGISTRATION_SUCCESS);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Use enhanced login method from auth service
    const user = await authService.login(email, password);

    logger.info(`${LOGGER_MESSAGES.USER_LOGGED_IN} ${user.email} from IP: ${req.ip}`);

    await authService.sendTokenResponse(user, 200, res, req);
  } catch (error) {
    // Log failed login attempt with IP
    logger.warn(`${LOGGER_MESSAGES.FAILED_LOGIN_ATTEMPT} ${email} from IP: ${req.ip}`);

    // Handle specific error types
    if (error.message.includes('Account locked')) {
      return next(new AppError(ERROR_MESSAGES.ACCOUNT_LOCKED, 423));
    }
    if (error.message.includes('Account inactive')) {
      return next(new AppError(ERROR_MESSAGES.ACCOUNT_INACTIVE, 403));
    }

    // Default to invalid credentials for security
    return next(new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, 401));
  }
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

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
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

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.PASSWORD_CHANGE_SUCCESS);
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
  try {
    validateAdminRole(req.user);
  } catch (error) {
    return next(error);
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

// ===== USER SECURITY STATUS ENDPOINTS =====

// @desc    Get user security status (login attempts, lock status, last login)
// @route   GET /api/auth/security-status
// @access  Private
export const getSecurityStatus = asyncHandler(async (req, res, next) => {
  try {
    const securityStatus = await authService.getUserSecurityStatus(req.user._id);

    res.status(200).json({
      success: true,
      data: securityStatus,
      message: SUCCESS_MESSAGES.SECURITY_STATUS_RETRIEVED_SUCCESS,
    });
  } catch (error) {
    logger.error(`Failed to get security status for user ${req.user._id}: ${error.message}`);
    return next(new AppError(ERROR_MESSAGES.FAILED_TO_RETRIEVE_SECURITY_STATUS, 500));
  }
});

// @desc    Reset user login attempts (Admin only)
// @route   POST /api/auth/reset-login-attempts/:userId
// @access  Private (Admin only)
export const resetLoginAttempts = asyncHandler(async (req, res, next) => {
  // Check if user is admin
  try {
    validateAdminRole(req.user);
  } catch (error) {
    return next(error);
  }

  const { userId } = req.params;

  try {
    const result = await authService.resetUserLoginAttempts(userId);

    logger.info(`Admin ${req.user.email} reset login attempts for user ${userId}`);

    res.status(200).json({
      success: true,
      message: result.message,
      userId: result.userId,
    });
  } catch (error) {
    logger.error(`Failed to reset login attempts for user ${userId}: ${error.message}`);
    return next(new AppError(ERROR_MESSAGES.FAILED_TO_RESET_LOGIN_ATTEMPTS, 500));
  }
});

// @desc    Check email verification status
// @route   GET /api/auth/email-status
// @access  Private
export const checkEmailStatus = asyncHandler(async (req, res, next) => {
  const user = await userService.findUserById(req.user._id);

  if (!user) {
    return next(new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404));
  }

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.EMAIL_STATUS_RETRIEVED, {
    isEmailVerified: user.isEmailVerified,
    email: user.email,
    emailVerificationExpires: user.emailVerificationExpires,
    canResendVerification: user.emailVerificationExpires
      ? new Date() > user.emailVerificationExpires
      : true,
  });
});
