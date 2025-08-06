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
  SESSION_RETRIEVED_SUCCESS: 'Session details retrieved successfully',
  SESSION_TERMINATED_SUCCESS: 'Session terminated successfully',
  OTHER_SESSIONS_TERMINATED_SUCCESS: 'All other sessions terminated successfully',

  // Security Status
  SECURITY_STATUS_RETRIEVED_SUCCESS: 'Security status retrieved successfully',
  LOGIN_ATTEMPTS_RESET_SUCCESS: 'Login attempts reset successfully',
  DEVICE_STATS_RETRIEVED_SUCCESS: 'Device statistics retrieved successfully',
  LOCATION_STATS_RETRIEVED_SUCCESS: 'Location statistics retrieved successfully',
  SECURITY_OVERVIEW_RETRIEVED_SUCCESS: 'Security overview retrieved successfully',

  // Profile and Avatar Success
  PROFILE_RETRIEVED: 'Profile retrieved successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  AVATAR_UPLOADED: 'Avatar uploaded successfully',
  AVATAR_REMOVED: 'Avatar removed successfully',

  // User Management Success
  USER_PROFILE_RETRIEVED: 'User profile retrieved successfully',
  USER_RETRIEVED: 'User retrieved successfully',
  USERS_RETRIEVED: 'Users retrieved successfully',
  USER_STATISTICS_RETRIEVED: 'User statistics retrieved successfully',

  // Email Verification Success
  EMAIL_STATUS_RETRIEVED: 'Email verification status retrieved successfully',

  // Token Verification Success
  TOKEN_VERIFIED: 'Token verified successfully',

  // Authentication Status Success
  AUTH_STATUS_RETRIEVED: 'Authentication status retrieved successfully',
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
  RATE_LIMIT_AVATAR_UPLOAD: 'Too many avatar upload attempts from this IP, please try again later.',
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

  // Security Status Errors
  FAILED_TO_RETRIEVE_SECURITY_STATUS: 'Failed to retrieve security status',
  FAILED_TO_RESET_LOGIN_ATTEMPTS: 'Failed to reset login attempts',

  // Session Management Errors
  SESSION_NOT_FOUND: 'Session not found',
  CANNOT_TERMINATE_CURRENT_SESSION: 'Cannot terminate current session',
  SESSION_TERMINATION_FAILED: 'Failed to terminate session',

  // Profile and Avatar Errors
  PROFILE_NOT_FOUND: 'Profile not found',
  AVATAR_UPLOAD_REQUIRED: 'Avatar file is required',
  AVATAR_NOT_FOUND: 'No avatar found to remove',
  NO_VALID_UPDATES: 'No valid fields provided for update',
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

  // Profile Validation
  BIO_TOO_LONG: 'Bio cannot exceed 500 characters',
  INVALID_BIO: 'Bio contains invalid content',
  INVALID_PROFILE_DATA: 'Invalid profile data provided',
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
  AVATAR_UPLOAD: 'AVATAR_UPLOAD_RATE_LIMIT_EXCEEDED',
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
  AVATAR_UPLOAD: 'Avatar upload endpoints',
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
