/**
 * Centralized message constants for the Express Auth API
 * This file contains all success, error, and validation messages
 * to ensure consistency across the application and tests.
 */

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  // Authentication
  REGISTRATION_SUCCESS:
    'User registered successfully. Please check your email to verify your account.',
  LOGIN_SUCCESS: 'User logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  LOGOUT_ALL_SUCCESS: 'Logged out from all devices successfully',
  TOKEN_REFRESH_SUCCESS: 'Tokens refreshed successfully',
  PASSWORD_UPDATE_SUCCESS: 'Password updated successfully',
  SESSION_REVOKED_SUCCESS: 'Session revoked successfully',
  SESSIONS_CLEANUP_SUCCESS: count => `Cleaned up ${count} expired sessions`,
  SESSIONS_REVOKE_SUCCESS: count => `Revoked ${count} user sessions`,

  // Email Verification
  EMAIL_VERIFICATION_SENT: 'Verification email sent successfully. Please check your inbox.',
  EMAIL_VERIFIED_SUCCESS: 'Email verified successfully. Your account is now active.',
  WELCOME_EMAIL_SENT: 'Welcome email sent successfully',

  // User Management
  PROFILE_UPDATE_SUCCESS: 'Profile updated successfully',
  ACCOUNT_DEACTIVATED_SUCCESS: 'Account deactivated successfully',
  USER_UPDATE_SUCCESS: 'User updated successfully',
  USER_DELETE_SUCCESS: 'User deleted successfully',

  // Session Management
  SESSIONS_RETRIEVED_SUCCESS: 'Sessions retrieved successfully',
  USER_SESSIONS_REVOKED_SUCCESS: count => `Revoked ${count} user sessions`,
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_DEACTIVATED: 'Account has been deactivated',
  ACCOUNT_LOCKED: 'Account is temporarily locked due to too many failed login attempts',
  ACCESS_TOKEN_REQUIRED: 'Access token required for authentication',
  ACCESS_TOKEN_EXPIRED: 'Access token expired. Please refresh your token.',
  ACCESS_TOKEN_INVALID: 'Invalid access token',
  REFRESH_TOKEN_REQUIRED: 'Refresh token required',
  TOKEN_REFRESH_FAILED: 'Token refresh failed',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',

  // Email Verification Errors
  EMAIL_NOT_VERIFIED: 'Please verify your email address before accessing this resource',
  EMAIL_VERIFICATION_TOKEN_INVALID: 'Invalid or expired email verification token',
  EMAIL_VERIFICATION_TOKEN_EXPIRED:
    'Email verification token has expired. Please request a new one.',
  EMAIL_ALREADY_VERIFIED: 'Email address is already verified',
  EMAIL_SEND_FAILED: 'Failed to send email. Please try again later.',
  EMAIL_VERIFICATION_REQUIRED: 'Email verification is required to complete this action',

  // User Errors
  USER_NOT_FOUND: 'User not found',
  USER_EMAIL_EXISTS: 'User with this email already exists',
  USERNAME_TAKEN: 'Username is already taken',
  EMAIL_TAKEN: 'Email is already taken',
  CANNOT_DELETE_OWN_ACCOUNT: 'You cannot delete your own account',

  // Authorization Errors
  UNAUTHORIZED_ROLE: role => `User role ${role} is not authorized to access this route`,
  UNAUTHORIZED_RESOURCE: 'Not authorized to access this resource',
  ADMIN_ROLE_REQUIRED: 'Access denied. Admin role required.',

  // Session Errors
  SESSION_RETRIEVAL_FAILED: 'Failed to retrieve sessions',
  SESSION_REVOKE_FAILED: 'Failed to revoke session',
  SESSIONS_REVOKE_FAILED: 'Failed to revoke sessions',
  SESSIONS_CLEANUP_FAILED: 'Failed to cleanup sessions',

  // General Errors
  API_ENDPOINT_NOT_FOUND: 'API endpoint not found',
  REQUEST_BODY_REQUIRED: 'Request body is required',
  VALIDATION_FAILED: 'Validation failed',
  QUERY_VALIDATION_FAILED: 'Query validation failed',
  INVALID_VALUE: 'Invalid value',

  // Database Errors
  RESOURCE_NOT_FOUND: 'Resource not found',
  DUPLICATE_KEY_ERROR: 'Duplicate key error',
  VALIDATION_ERROR: 'Validation error',
  JWT_EXPIRED: 'JWT token expired',
  JWT_INVALID: 'Invalid JWT token',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  RATE_LIMIT_IP: 'Too many requests from this IP, please try again later.',
  RATE_LIMIT_AUTH: 'Too many authentication attempts from this IP, please try again later.',
  RATE_LIMIT_PASSWORD_RESET:
    'Too many password reset attempts from this IP, please try again later.',
  RATE_LIMIT_PROFILE_UPDATE:
    'Too many profile update attempts from this IP, please try again later.',
  RATE_LIMIT_ADMIN: 'Too many admin requests from this IP, please try again later.',
  TOKEN_EXPIRED: 'Token expired',
  SERVER_ERROR: 'Server Error',

  // Service/Utility Errors
  INVALID_TIME_FORMAT: 'Invalid time format',
  TOKEN_VALIDATION_FAILED: 'Token validation failed',

  // Auth Service Errors
  TOKEN_REFRESH_OPERATION_FAILED: 'Token refresh failed:',
  TOKEN_REFRESH_HANDLING_FAILED: 'Token refresh handling failed:',
  SESSION_CLEANUP_OPERATION_FAILED: 'Session cleanup failed:',
  SESSION_REVOCATION_OPERATION_FAILED: 'Session revocation failed:',
  ACTIVE_SESSIONS_COUNT_FAILED: 'Failed to get active sessions count:',
  USER_SESSIONS_RETRIEVAL_FAILED: 'Failed to get user sessions:',
  REFRESH_TOKEN_EXPIRED_OR_INVALID: 'Refresh token expired or invalid',
  ACCESS_TOKEN_EXPIRED_OR_INVALID: 'Access token expired or invalid',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  SESSION_EXPIRED_OR_INACTIVE: 'Session expired or inactive',
  SESSION_IS_INACTIVE: 'Session is inactive',
  SESSION_NOT_FOUND_OR_INACTIVE: 'Session not found or already inactive',
  SESSION_NOT_FOUND_FOR_REFRESH: 'Session not found for refresh token',
  SESSION_NOT_FOUND_FOR_ACCESS: 'Session not found for access token',
  INVALID_TOKEN_TYPE: 'Invalid token type specified',
  INVALID_OR_INACTIVE_SESSION: 'Invalid or inactive session',
  FAILED_TO_RETRIEVE_SESSIONS: 'Failed to retrieve sessions',
  FAILED_TO_REVOKE_SESSION: 'Failed to revoke session',
  FAILED_TO_REVOKE_SESSIONS: 'Failed to revoke sessions',
  FAILED_TO_CLEANUP_SESSIONS: 'Failed to cleanup sessions',
};

// ============================================================================
// VALIDATION MESSAGES
// ============================================================================

export const VALIDATION_MESSAGES = {
  // Username Validation
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_MIN_LENGTH: 'Username must be at least 3 characters long',
  USERNAME_MAX_LENGTH: 'Username cannot exceed 30 characters',
  USERNAME_INVALID_CHARS: 'Username can only contain letters, numbers, underscores, and hyphens',

  // Email Validation
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email address',

  // Password Validation
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters long',
  PASSWORD_NEW_MIN_LENGTH: 'New password must be at least 8 characters long',
  PASSWORD_LOWERCASE_REQUIRED: 'Password must contain at least one lowercase letter',
  PASSWORD_UPPERCASE_REQUIRED: 'Password must contain at least one uppercase letter',
  PASSWORD_NUMBER_REQUIRED: 'Password must contain at least one number',
  PASSWORD_SPECIAL_CHAR_REQUIRED: 'Password must contain at least one special character',
  PASSWORD_CONFIRM_REQUIRED: 'Please confirm your password',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
  PASSWORD_MUST_BE_DIFFERENT: 'New password must be different from current password',
  CURRENT_PASSWORD_REQUIRED: 'Current password is required',

  // Token Validation
  RESET_TOKEN_REQUIRED: 'Reset token is required',

  // Bio Validation
  BIO_MAX_LENGTH: 'Bio cannot exceed 500 characters',

  // Role Validation
  ROLE_INVALID: 'Role must be user, admin, or moderator',

  // Boolean Validation
  IS_ACTIVE_INVALID: 'isActive must be a boolean value',
  IS_EMAIL_VERIFIED_INVALID: 'isEmailVerified must be a boolean value',
  IS_ACTIVE_QUERY_INVALID: 'isActive must be true or false',

  // Pagination Validation
  PAGE_REQUIRED: 'Page must be a positive number',
  PAGE_MIN_VALUE: 'Page must be greater than 0',
  LIMIT_REQUIRED: 'Limit must be a positive number',
  LIMIT_RANGE: 'Limit must be between 1 and 100',

  // Search Validation
  SEARCH_TERM_REQUIRED: 'Search term must not be empty',
  SEARCH_TERM_MAX_LENGTH: 'Search term cannot exceed 100 characters',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a validation message by key
 * @param {string} key - The message key
 * @returns {string} The validation message
 */
export const getValidationMessage = key => {
  return VALIDATION_MESSAGES[key] || 'Validation error';
};

/**
 * Get an error message by key
 * @param {string} key - The message key
 * @param {...any} args - Arguments for dynamic messages
 * @returns {string} The error message
 */
export const getErrorMessage = (key, ...args) => {
  const message = ERROR_MESSAGES[key];
  return typeof message === 'function' ? message(...args) : message || 'An error occurred';
};

/**
 * Get a success message by key
 * @param {string} key - The message key
 * @param {...any} args - Arguments for dynamic messages
 * @returns {string} The success message
 */
export const getSuccessMessage = (key, ...args) => {
  const message = SUCCESS_MESSAGES[key];
  return typeof message === 'function' ? message(...args) : message || 'Operation successful';
};

// Console and Logger Messages
export const CONSOLE_MESSAGES = {
  // Rate Limiter
  AUTH_RATE_LIMITER_TRIGGERED: '🚨 AUTH RATE LIMITER TRIGGERED!',
  AUTH_RATE_LIMITER_SKIP_CHECK: '🔍 AUTH RATE LIMITER SKIP CHECK:',

  // Environment Config
  ENV_CONFIG_LOADED: '\n✅ Environment Configuration Loaded Successfully',
  ENV_MISSING_TITLE: '\n🚨 MISSING REQUIRED ENVIRONMENT VARIABLES 🚨',
  ENV_VALIDATION_ERRORS_TITLE: '\n🚨 ENVIRONMENT VALIDATION ERRORS 🚨',
  ENV_HOW_TO_FIX: '📝 How to fix:',
  ENV_STEP_1: '1. Create a .env file in your project root',
  ENV_STEP_2: '2. Add the missing environment variables',
  ENV_STEP_3: '3. You can copy .env.example as a starting point',
  ENV_EXAMPLE_FILE: 'Example .env file:',
  ENV_CANNOT_START: '\n💀 Application cannot start without these variables.\n',
  DEV_MODE_LOGS_CLEARED: '🧹 Development mode: Log files cleared for fresh start',
  DEV_MODE_DETAILED_LOGGING: '🔧 Development mode: Detailed logging enabled',
  LOG_FILES_CLEAR_WARNING: '⚠️  Could not clear log files:',

  // Server Messages
  REQUEST_LABEL: 'Request:',
  NODE_ENV_LABEL: 'NODE_ENV:',
};

export const LOGGER_MESSAGES = {
  // Database
  DATABASE_CONNECTION_SUCCESS: '✅ MongoDB Connected:',

  // Server
  HTTP_SERVER_CLOSED: 'HTTP server closed',
  DATABASE_CONNECTION_CLOSED: 'Database connection closed',
  UNCAUGHT_EXCEPTION: 'Uncaught Exception:',
  UNHANDLED_REJECTION_AT: 'Unhandled Rejection at:',
  UNHANDLED_REJECTION_REASON: 'reason:',
  FAILED_TO_START_SERVER: 'Failed to start server:',
  SERVER_RUNNING: '🚀 Server running on port',
  API_AVAILABLE: '📡 API available at:',
  HEALTH_CHECK: '🏥 Health check:',
  GRACEFUL_SHUTDOWN: 'received, shutting down gracefully',

  // Auth Middleware
  ACCESS_TOKEN_VALIDATION_FAILED: 'Access token validation failed:',
  OPTIONAL_AUTH_FAILED: 'Optional auth failed:',
  SESSION_IP_MISMATCH: 'Session IP mismatch for user',

  // Rate Limiter
  RATE_LIMIT_EXCEEDED_IP: 'Rate limit exceeded for IP:',
  PASSWORD_RESET_RATE_LIMIT_EXCEEDED_IP: 'Password reset rate limit exceeded for IP:',
  PROFILE_UPDATE_RATE_LIMIT_EXCEEDED_IP: 'Profile update rate limit exceeded for IP:',
  READ_ONLY_RATE_LIMIT_EXCEEDED_IP: 'Read-only rate limit exceeded for IP:',
  ADMIN_RATE_LIMIT_EXCEEDED_IP: 'Admin rate limit exceeded for IP:',
  CUSTOM_RATE_LIMIT_EXCEEDED_IP: 'Custom rate limit exceeded for IP:',

  // Auth Controller
  TOKEN_REFRESH_FAILED: 'Token refresh failed:',
  FAILED_TO_GET_USER_SESSIONS: 'Failed to get user sessions:',
  FAILED_TO_REVOKE_SESSION: 'Failed to revoke session:',
  FAILED_TO_REVOKE_ALL_SESSIONS: 'Failed to revoke all sessions:',
  FAILED_TO_CLEANUP_SESSIONS: 'Failed to cleanup sessions:',

  // Auth Controller - Success Messages
  NEW_USER_REGISTERED: 'New user registered:',
  USER_LOGGED_IN: 'User logged in:',
  USER_LOGGED_OUT: 'User logged out:',
  USER_LOGGED_OUT_ALL_DEVICES: 'User logged out from all devices:',
  PASSWORD_CHANGED: 'Password changed for user:',
  SESSION_REVOKED: 'Session revoked for user:',
  ALL_SESSIONS_REVOKED: 'All sessions revoked for user:',
  SESSION_CLEANUP_COMPLETED: 'Session cleanup completed:',

  // Auth Controller - Warning Messages
  FAILED_LOGIN_ATTEMPT: 'Failed login attempt for user:',

  // User Controller - Success Messages
  PROFILE_UPDATED: 'Profile updated for user:',
  USER_ACCOUNT_DEACTIVATED: 'User account deactivated:',
  USER_UPDATED_BY_ADMIN: 'User updated by admin:',
  USER_DELETED_BY_ADMIN: 'User deleted by admin:',

  // Database
  DATABASE_CONNECTION_ERROR: '❌ Database connection error:',
  MONGOOSE_CONNECTION_ERROR: 'Mongoose connection error:',
  MONGOOSE_DISCONNECTED: 'Mongoose disconnected from MongoDB',
};

// Validation Constants
export const VALIDATION_TYPES = {
  MISSING_BODY: 'MISSING_BODY',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_FIELD: 'unknown',
};

// Cookie Constants
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  SESSION_ID: 'sessionId',
};

export const COOKIE_PATHS = {
  DEFAULT: '/',
  REFRESH_TOKEN: '/api/auth/refresh',
};

export const COOKIE_CONFIG = {
  SAME_SITE: 'strict',
  CLEAR_VALUE: 'none',
};

// Rate Limiter Types
export const RATE_LIMIT_TYPES = {
  GENERAL: 'RATE_LIMIT_EXCEEDED',
  AUTH: 'AUTH_RATE_LIMIT_EXCEEDED',
  PASSWORD_RESET: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
  PROFILE: 'PROFILE_RATE_LIMIT_EXCEEDED',
  READ: 'READ_RATE_LIMIT_EXCEEDED',
  ADMIN: 'ADMIN_RATE_LIMIT_EXCEEDED',
  CUSTOM: 'CUSTOM_RATE_LIMIT_EXCEEDED',
};

// Rate Limiter Descriptions
export const RATE_LIMIT_DESCRIPTIONS = {
  GENERAL: 'General API endpoints',
  AUTH: 'Authentication endpoints (login, register)',
  PASSWORD_RESET: 'Password reset endpoints',
  PROFILE: 'Profile update endpoints',
  READ: 'Read-only endpoints (GET requests)',
  ADMIN: 'Admin endpoints',
};

// Auth Messages
export const AUTH_MESSAGES = {
  NOT_AUTHORIZED_RESOURCE: 'Not authorized to access this resource',
  ROLE_NOT_AUTHORIZED: role => `User role ${role} is not authorized to access this route`,
};

// Token Keywords
export const TOKEN_KEYWORDS = {
  EXPIRED: 'expired',
};

// User Role Constants
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
};

// Dynamic message functions
export const getAuthRateLimitWarning = ip => `Auth rate limit exceeded for IP: ${ip}`;
export const getEnvDisplayMessage = (label, value) => `${label}: ${value}`;
export const getEnvErrorMessage = (key, description, example) =>
  `❌ ${key}\n   Description: ${description}\n   Example: ${example}`;
export const getEnvExampleLine = (key, example) => `${key}=${example}`;
