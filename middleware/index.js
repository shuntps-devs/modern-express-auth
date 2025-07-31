/**
 * Middleware Barrel Export
 * Centralizes all middleware exports for easier imports
 */

// Authentication Middleware
export {
  protect,
  authorize,
  optionalAuth,
  checkOwnership
} from './auth_middleware.js';

// Error Handling Middleware
export {
  AppError,
  asyncHandler,
  errorHandler
} from './error_handler.js';

// Rate Limiting Middleware
export {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  profileLimiter,
  readOnlyLimiter,
  adminLimiter,
  createCustomLimiter,
  getRateLimiterInfo
} from './rate_limiter.js';

// Individual exports are available above - no default exports needed
