/**
 * Admin Helper Utility
 * Centralizes admin role validation logic
 */

import { AppError } from '../middleware/index.js';
import { ERROR_MESSAGES, USER_ROLES } from '../constants/index.js';

/**
 * Validate if user has admin role
 * @param {Object} user - User object from request
 * @throws {AppError} If user is not admin
 */
export const validateAdminRole = user => {
  if (user.role !== USER_ROLES.ADMIN) {
    throw new AppError(ERROR_MESSAGES.ADMIN_ROLE_REQUIRED, 403);
  }
};

/**
 * Middleware function to validate admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireAdminRole = (req, res, next) => {
  try {
    validateAdminRole(req.user);
    next();
  } catch (error) {
    next(error);
  }
};
