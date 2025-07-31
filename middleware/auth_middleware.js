import { asyncHandler, AppError } from './error_handler.js';
import {
  ERROR_MESSAGES,
  LOGGER_MESSAGES,
  AUTH_MESSAGES,
  TOKEN_KEYWORDS,
  USER_ROLES,
} from '../constants/messages.js';

import AuthService from '../services/auth_service.js';
import { logger } from '../config/logger_config.js';

// Protect routes - require authentication
export const protect = asyncHandler(async (req, res, next) => {
  let accessToken;

  // Get access token from header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    accessToken = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.accessToken) {
    accessToken = req.cookies.accessToken;
  }

  // Make sure access token exists
  if (!accessToken) {
    return next(new AppError(ERROR_MESSAGES.ACCESS_TOKEN_REQUIRED, 401));
  }

  try {
    // Validate access token using AuthService
    const { session, user } =
      await AuthService.validateAccessToken(accessToken);

    // Check if user account is locked
    if (user.isLocked) {
      return next(new AppError(ERROR_MESSAGES.ACCOUNT_LOCKED, 423));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError(ERROR_MESSAGES.ACCOUNT_DEACTIVATED, 401));
    }

    // Verify IP address for session security (optional warning)
    const currentIP = req.ip || req.connection.remoteAddress;
    if (session.ipAddress !== currentIP) {
      logger.warn(
        `${LOGGER_MESSAGES.SESSION_IP_MISMATCH} ${user._id}: expected ${session.ipAddress}, got ${currentIP}`
      );
      // Log warning but don't block (user might be on different network)
    }

    // Grant access to protected route
    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    logger.error(LOGGER_MESSAGES.ACCESS_TOKEN_VALIDATION_FAILED, error.message);

    // Check if it's an expired token error
    if (error.message.includes(TOKEN_KEYWORDS.EXPIRED)) {
      return next(new AppError(ERROR_MESSAGES.ACCESS_TOKEN_EXPIRED, 401));
    }

    return next(new AppError(ERROR_MESSAGES.ACCESS_TOKEN_INVALID, 401));
  }
});

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(AUTH_MESSAGES.ROLE_NOT_AUTHORIZED(req.user.role), 403)
      );
    }
    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let accessToken;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    accessToken = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.accessToken) {
    accessToken = req.cookies.accessToken;
  }

  if (accessToken) {
    try {
      const { session, user } =
        await AuthService.validateAccessToken(accessToken);

      if (user && user.isActive && !user.isLocked) {
        req.user = user;
        req.session = session;
      }
    } catch (error) {
      // Token is invalid, but we don't fail - just continue without user
      logger.debug(LOGGER_MESSAGES.OPTIONAL_AUTH_FAILED, error.message);
    }
  }

  next();
});

// Check if user owns resource or is admin
export const checkOwnership = (resourceUserField = 'user') => {
  return (req, res, next) => {
    // Admin can access everything
    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.resource
      ? req.resource[resourceUserField]
      : req.params.userId;

    if (
      resourceUserId &&
      resourceUserId.toString() !== req.user._id.toString()
    ) {
      return next(new AppError(AUTH_MESSAGES.NOT_AUTHORIZED_RESOURCE, 403));
    }

    next();
  };
};
