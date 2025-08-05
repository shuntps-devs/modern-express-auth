/**
 * Profile Controller
 * Handles user profile operations including avatar management
 */

import { userService } from '../services/index.js';
import { getAvatarUrl, removeAvatarFile } from '../middleware/index.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/index.js';
import { asyncHandler } from '../middleware/index.js';
import { Profile } from '../models/index.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/index.js';

/**
 * Get user profile
 * @route GET /api/profile
 * @access Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const profile = await userService.getUserProfile(userId);

  if (!profile) {
    return sendErrorResponse(res, 404, ERROR_MESSAGES.PROFILE_NOT_FOUND);
  }

  // Format profile response to ensure bio and avatar are properly exposed
  const formattedProfile = userService.formatProfileResponse(profile);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.PROFILE_RETRIEVED, {
    profile: formattedProfile,
    user: profile.userId, // Include populated user data
  });
});

/**
 * Upload/Update user avatar
 * @route PATCH /api/profile/avatar
 * @access Private
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // File is available from multer middleware
  if (!req.file) {
    return sendErrorResponse(res, 400, ERROR_MESSAGES.AVATAR_UPLOAD_REQUIRED);
  }

  const avatarData = {
    url: getAvatarUrl(userId, req.file.filename),
    filename: req.file.filename,
  };

  const updatedProfile = await userService.updateUserAvatar(userId, avatarData);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.AVATAR_UPLOADED, {
    profile: updatedProfile,
    avatar: {
      url: avatarData.url,
      filename: avatarData.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

/**
 * Remove user avatar
 * @route DELETE /api/profile/avatar
 * @access Private
 */
export const removeAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get current profile to find avatar filename
  const currentProfile = await userService.getUserProfile(userId);

  if (!currentProfile || !currentProfile.avatar?.filename) {
    return sendErrorResponse(res, 404, ERROR_MESSAGES.AVATAR_NOT_FOUND);
  }

  // Remove avatar file from filesystem
  await removeAvatarFile(userId, currentProfile.avatar.filename);

  // Remove avatar from database
  const updatedProfile = await userService.removeUserAvatar(userId);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.AVATAR_REMOVED, {
    profile: updatedProfile,
  });
});

/**
 * Update user profile (excluding avatar)
 * @route PATCH /api/profile
 * @access Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const validatedData = req.body; // Data is already validated by middleware

  // Check if there are valid updates
  if (Object.keys(validatedData).length === 0) {
    return sendErrorResponse(res, 400, ERROR_MESSAGES.NO_VALID_UPDATES);
  }

  // Update profile
  const updatedProfile = await Profile.findOneAndUpdate(
    { userId },
    { $set: validatedData },
    { new: true, upsert: true, runValidators: true },
  ).populate('userId', 'username email role isActive isEmailVerified avatar');

  // Format profile response to ensure bio and avatar are properly exposed
  const formattedProfile = userService.formatProfileResponse(updatedProfile);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.PROFILE_UPDATED, {
    profile: formattedProfile,
    user: updatedProfile.userId, // Include populated user data
  });
});

export default {
  getProfile,
  uploadAvatar,
  removeAvatar,
  updateProfile,
};
