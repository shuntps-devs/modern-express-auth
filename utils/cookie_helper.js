import { env } from '../config/env_config.js';
import { COOKIE_NAMES, COOKIE_PATHS, COOKIE_CONFIG } from '../constants/messages.js';

/**
 * Cookie Helper Utility
 * Centralizes cookie configuration for consistent behavior across the application
 */

/**
 * Create standardized cookie options
 * @param {Date} expiresAt - Expiration date for the cookie
 * @param {string} path - Cookie path (default: '/')
 * @param {Object} additionalOptions - Additional cookie options to merge
 * @returns {Object} Cookie options object
 */
export const createCookieOptions = (
  expiresAt,
  path = COOKIE_PATHS.DEFAULT,
  additionalOptions = {}
) => {
  const baseOptions = {
    expires: expiresAt,
    httpOnly: true,
    secure: env.isProduction,
    sameSite: COOKIE_CONFIG.SAME_SITE,
  };

  // Add path if it's not the default
  if (path !== COOKIE_PATHS.DEFAULT) {
    baseOptions.path = path;
  }

  // Merge with additional options
  return { ...baseOptions, ...additionalOptions };
};

/**
 * Create access token cookie options
 * @param {Date} expiresAt - Expiration date for the access token
 * @returns {Object} Access token cookie options
 */
export const createAccessTokenCookieOptions = (expiresAt) => {
  return createCookieOptions(expiresAt);
};

/**
 * Create refresh token cookie options
 * @param {Date} expiresAt - Expiration date for the refresh token
 * @returns {Object} Refresh token cookie options
 */
export const createRefreshTokenCookieOptions = (expiresAt) => {
  return createCookieOptions(expiresAt, COOKIE_PATHS.REFRESH_TOKEN);
};

/**
 * Create session ID cookie options
 * @param {Date} expiresAt - Expiration date for the session
 * @returns {Object} Session ID cookie options
 */
export const createSessionCookieOptions = (expiresAt) => {
  return createCookieOptions(expiresAt);
};

/**
 * Calculate expiration dates for tokens
 * @param {number} accessTokenExpiry - Access token expiry in milliseconds
 * @param {number} refreshTokenExpiry - Refresh token expiry in milliseconds
 * @returns {Object} Object containing calculated expiration dates
 */
export const calculateTokenExpirations = (
  accessTokenExpiry,
  refreshTokenExpiry
) => {
  const now = Date.now();
  return {
    accessTokenExpiresAt: new Date(now + accessTokenExpiry),
    refreshTokenExpiresAt: new Date(now + refreshTokenExpiry),
  };
};

/**
 * Set authentication cookies on response
 * @param {Object} res - Express response object
 * @param {Object} tokens - Object containing accessToken, refreshToken, and sessionId
 * @param {Object} expirations - Object containing expiration dates
 */
export const setAuthCookies = (res, tokens, expirations) => {
  const { accessToken, refreshToken, sessionId } = tokens;
  const { accessTokenExpiresAt, refreshTokenExpiresAt } = expirations;

  // Set access token cookie
  res.cookie(
    COOKIE_NAMES.ACCESS_TOKEN,
    accessToken,
    createAccessTokenCookieOptions(accessTokenExpiresAt)
  );

  // Set refresh token cookie
  res.cookie(
    COOKIE_NAMES.REFRESH_TOKEN,
    refreshToken,
    createRefreshTokenCookieOptions(refreshTokenExpiresAt)
  );

  // Set session ID cookie
  res.cookie(
    COOKIE_NAMES.SESSION_ID,
    sessionId,
    createSessionCookieOptions(accessTokenExpiresAt)
  );
};

/**
 * Clear authentication cookies
 * @param {Object} res - Express response object
 */
export const clearAuthCookies = (res) => {
  const clearOptions = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: COOKIE_CONFIG.SAME_SITE,
  };

  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, clearOptions);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    ...clearOptions,
    path: COOKIE_PATHS.REFRESH_TOKEN,
  });
  res.clearCookie(COOKIE_NAMES.SESSION_ID, clearOptions);
};
