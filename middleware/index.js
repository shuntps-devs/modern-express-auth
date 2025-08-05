/**
 * Middleware Barrel Export
 * Centralizes all middleware exports for easier imports
 */

// Authentication Middleware
export { protect, authorize, optionalAuth, checkOwnership } from './auth_middleware.js';

// Export all middleware
export * from './auth_middleware.js';
export * from './error_handler.js';
export * from './rate_limiter.js';
export * from './email_verification_middleware.js';
export * from './avatar_upload.js';

// Error Handling Middleware
export { AppError, asyncHandler, errorHandler } from './error_handler.js';

// Rate Limiting Middleware
export {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  avatarUploadLimiter,
  profileLimiter,
  readOnlyLimiter,
  adminLimiter,
  createCustomLimiter,
  getRateLimiterInfo,
} from './rate_limiter.js';

// Individual exports are available above - no default exports needed
