import { asyncHandler } from '../middleware/index.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/index.js';
import { logger } from '../config/index.js';
import { userService, authService } from '../services/index.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendUserResponse,
  sendPaginatedResponse,
} from '../utils/index.js';

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const user = userService.formatUserResponse(req.user, true);

  return sendUserResponse(res, SUCCESS_MESSAGES.USER_PROFILE_RETRIEVED, user);
});

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { username, email, bio } = req.body;

  if (username && username !== req.user.username) {
    const existingUser = await userService.findUserByUsername(username);
    if (existingUser) {
      return sendErrorResponse(res, 400, ERROR_MESSAGES.USERNAME_TAKEN);
    }
  }

  if (email && email !== req.user.email) {
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return sendErrorResponse(res, 400, ERROR_MESSAGES.EMAIL_TAKEN);
    }
  }

  const updatedUser = await userService.updateUser(req.user._id, {
    ...(username && { username }),
    ...(email && { email }),
    ...(bio && { bio }),
  });

  const userResponse = userService.formatUserResponse(updatedUser, true);

  return sendUserResponse(res, SUCCESS_MESSAGES.PROFILE_UPDATE_SUCCESS, userResponse);
});

// @desc    Delete user account
// @route   DELETE /api/user/profile
// @access  Private
export const deleteAccount = asyncHandler(async (req, res) => {
  await userService.deactivateUser(req.user._id);
  await authService.terminateSession(req.user._id);
  authService.clearAuthCookies(res);

  logger.warn(`Account deactivated: ${req.user.email} from IP: ${req.ip}`);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.ACCOUNT_DEACTIVATED_SUCCESS);
});

// @desc    Get all users
// @route   GET /api/user/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const filters = {
    role: req.query.role,
    isActive: req.query.isActive,
    search: req.query.search,
  };

  const result = await userService.getAllUsers(page, limit, filters);

  return sendPaginatedResponse(
    res,
    SUCCESS_MESSAGES.USERS_RETRIEVED,
    result.users,
    result.pagination,
  );
});

// @desc    Get single user (Admin)
// @route   GET /api/user/admin/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.findUserById(req.params.id);

  if (!user) {
    return sendErrorResponse(res, 404, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  return sendUserResponse(
    res,
    SUCCESS_MESSAGES.USER_RETRIEVED,
    userService.formatUserResponse(user, true),
  );
});

// @desc    Update user (Admin)
// @route   PUT /api/user/admin/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  const { role, isActive, isEmailVerified } = req.body;

  const user = await userService.findUserById(req.params.id);

  if (!user) {
    return sendErrorResponse(res, 404, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const updatedUser = await userService.updateUser(req.params.id, {
    ...(role && { role }),
    ...(isActive !== undefined && { isActive }),
    ...(isEmailVerified !== undefined && { isEmailVerified }),
  });

  logger.warn(`Admin action: User ${updatedUser.email} updated by ${req.user.email} from IP: ${req.ip}`);

  return sendUserResponse(
    res,
    SUCCESS_MESSAGES.USER_UPDATE_SUCCESS,
    userService.formatUserResponse(updatedUser, true),
  );
});

// @desc    Delete user (Admin)
// @route   DELETE /api/user/admin/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await userService.findUserById(req.params.id);

  if (!user) {
    return sendErrorResponse(res, 404, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  if (user._id.toString() === req.user._id.toString()) {
    return sendErrorResponse(res, 400, ERROR_MESSAGES.CANNOT_DELETE_OWN_ACCOUNT);
  }

  await userService.deactivateUser(req.params.id);

  logger.warn(`Admin action: User ${user.email} deleted by ${req.user.email} from IP: ${req.ip}`);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.USER_DELETE_SUCCESS);
});

// @desc    Get user statistics (Admin)
// @route   GET /api/user/admin/stats
// @access  Private/Admin
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStatistics();

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.USER_STATISTICS_RETRIEVED, { stats });
});
