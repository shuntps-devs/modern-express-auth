import { asyncHandler, AppError } from '../middleware/index.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, LOGGER_MESSAGES } from '../constants/index.js';
import { logger } from '../config/index.js';
import { userService, authService } from '../services/index.js';

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const user = userService.formatUserResponse(req.user, true); // include additional details

  res.status(200).json({
    success: true,
    user,
  });
});

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { username, email, bio } = req.body;

  // Check if username is already taken (if provided and different from current)
  if (username && username !== req.user.username) {
    const existingUser = await userService.findUserByUsername(username);
    if (existingUser) {
      return next(new AppError(ERROR_MESSAGES.USERNAME_TAKEN, 400));
    }
  }

  // Check if email is already taken (if provided and different from current)
  if (email && email !== req.user.email) {
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return next(new AppError(ERROR_MESSAGES.EMAIL_TAKEN, 400));
    }
  }

  // Update user
  const updatedUser = await userService.updateUser(req.user._id, {
    ...(username && { username }),
    ...(email && { email }),
    ...(bio && { bio }),
  });

  logger.info(`${LOGGER_MESSAGES.PROFILE_UPDATED} ${updatedUser.email}`);

  const userResponse = userService.formatUserResponse(updatedUser, true);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.PROFILE_UPDATE_SUCCESS,
    user: userResponse,
  });
});

// @desc    Delete user account
// @route   DELETE /api/user/profile
// @access  Private
export const deleteAccount = asyncHandler(async (req, res) => {
  // Deactivate user instead of deleting (soft delete)
  await userService.deactivateUser(req.user._id);

  // Deactivate all sessions
  await req.user.deactivateAllSessions();

  // Clear cookies
  authService.clearAuthCookies(res);

  logger.info(`${LOGGER_MESSAGES.USER_ACCOUNT_DEACTIVATED} ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.ACCOUNT_DEACTIVATED_SUCCESS,
  });
});

// Admin Controllers
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

  res.status(200).json({
    success: true,
    users: result.users,
    pagination: result.pagination,
  });
});

// @desc    Get single user (Admin)
// @route   GET /api/user/admin/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req, res, next) => {
  const user = await userService.findUserById(req.params.id);

  if (!user) {
    return next(new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404));
  }

  res.status(200).json({
    success: true,
    user: userService.formatUserResponse(user, true),
  });
});

// @desc    Update user (Admin)
// @route   PUT /api/user/admin/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res, next) => {
  const { role, isActive, isEmailVerified } = req.body;

  const user = await userService.findUserById(req.params.id);

  if (!user) {
    return next(new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404));
  }

  // Update user
  const updatedUser = await userService.updateUser(req.params.id, {
    ...(role && { role }),
    ...(isActive !== undefined && { isActive }),
    ...(isEmailVerified !== undefined && { isEmailVerified }),
  });

  logger.info(`${LOGGER_MESSAGES.USER_UPDATED_BY_ADMIN} ${updatedUser.email} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.USER_UPDATE_SUCCESS,
    user: userService.formatUserResponse(updatedUser, true),
  });
});

// @desc    Delete user (Admin)
// @route   DELETE /api/user/admin/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await userService.findUserById(req.params.id);

  if (!user) {
    return next(new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404));
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError(ERROR_MESSAGES.CANNOT_DELETE_OWN_ACCOUNT, 400));
  }

  // Soft delete - deactivate user
  await userService.deactivateUser(req.params.id);

  logger.info(`${LOGGER_MESSAGES.USER_DELETED_BY_ADMIN} ${user.email} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.USER_DELETE_SUCCESS,
  });
});

// @desc    Get user statistics (Admin)
// @route   GET /api/user/admin/stats
// @access  Private/Admin
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStatistics();

  res.status(200).json({
    success: true,
    stats,
  });
});
