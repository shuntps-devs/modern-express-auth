import { AppError } from './error_handler.js';
import { ERROR_MESSAGES } from '../constants/index.js';

/**
 * Middleware to ensure user's email is verified
 * This middleware should be used after the protect middleware
 * to ensure the user is authenticated before checking email verification
 */
export const requireEmailVerification = (req, res, next) => {
  // Check if user exists (should be set by protect middleware)
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // Check if email is verified
  if (!req.user.isEmailVerified) {
    return next(new AppError(ERROR_MESSAGES.EMAIL_NOT_VERIFIED, 403));
  }

  // Email is verified, proceed to next middleware
  next();
};

/**
 * Optional email verification middleware
 * This middleware checks email verification but doesn't block the request
 * It adds a flag to the request object indicating verification status
 */
export const optionalEmailVerification = (req, res, next) => {
  // Add email verification status to request
  if (req.user) {
    req.isEmailVerified = req.user.isEmailVerified || false;
  } else {
    req.isEmailVerified = false;
  }

  // Always proceed to next middleware
  next();
};

/**
 * Middleware to check if email verification is required for specific actions
 * This can be configured per route to determine which actions require verification
 */
export const emailVerificationRequired = (options = {}) => {
  const { skipForAdmins = true, customMessage = null } = options;

  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Skip verification for admins if configured
    if (skipForAdmins && req.user.role === 'admin') {
      return next();
    }

    // Check if email is verified
    if (!req.user.isEmailVerified) {
      const message = customMessage || ERROR_MESSAGES.EMAIL_VERIFICATION_REQUIRED;
      return next(new AppError(message, 403));
    }

    // Email is verified, proceed
    next();
  };
};
