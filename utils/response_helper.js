/**
 * Response Helper Utility
 * Centralizes common JSON response patterns for consistency
 */

/**
 * Send success response with data
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data
 */
export const sendSuccessResponse = (res, statusCode = 200, message, data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} errors - Additional error details
 */
export const sendErrorResponse = (res, statusCode = 400, message, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Array} items - Data items
 * @param {Object} pagination - Pagination info
 */
export const sendPaginatedResponse = (res, message, items, pagination) => {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination,
  });
};

/**
 * Send user response with formatted user data
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} user - User object
 * @param {Object} additionalData - Additional data to include
 */
export const sendUserResponse = (res, message, user, additionalData = null) => {
  const response = {
    success: true,
    message,
    user,
  };

  if (additionalData) {
    Object.assign(response, additionalData);
  }

  return res.status(200).json(response);
};

/**
 * Send session response with session data
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object|Array} sessions - Session data
 * @param {Object} additionalData - Additional data to include
 */
export const sendSessionResponse = (res, message, sessions, additionalData = null) => {
  const response = {
    success: true,
    message,
    data: {
      sessions: Array.isArray(sessions) ? sessions : [sessions],
      total: Array.isArray(sessions) ? sessions.length : 1,
    },
  };

  if (additionalData) {
    Object.assign(response.data, additionalData);
  }

  return res.status(200).json(response);
};
