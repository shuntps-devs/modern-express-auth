/**
 * Profile Controller
 * Handles user profile operations including avatar management
 */

import { userService } from '../services/index.js';
import { getAvatarUrl, removeAvatarFile } from '../middleware/index.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/index.js';
import { asyncHandler } from '../middleware/index.js';
import { validateProfileUpdate } from '../validations/index.js';

/**
 * Get user profile
 * @route GET /api/profile
 * @access Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const profile = await userService.getUserProfile(userId);

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: ERROR_MESSAGES.PROFILE_NOT_FOUND,
    });
  }

  // Format profile response to ensure bio and avatar are properly exposed
  const formattedProfile = userService.formatProfileResponse(profile);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.PROFILE_RETRIEVED,
    data: {
      profile: formattedProfile,
      user: profile.userId, // Include populated user data
    },
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
    return res.status(400).json({
      success: false,
      message: ERROR_MESSAGES.AVATAR_UPLOAD_REQUIRED,
    });
  }

  const avatarData = {
    url: getAvatarUrl(userId, req.file.filename),
    filename: req.file.filename,
  };

  const updatedProfile = await userService.updateUserAvatar(userId, avatarData);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.AVATAR_UPLOADED,
    data: {
      profile: updatedProfile,
      avatar: {
        url: avatarData.url,
        filename: avatarData.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
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
    return res.status(404).json({
      success: false,
      message: ERROR_MESSAGES.AVATAR_NOT_FOUND,
    });
  }

  // Remove avatar file from filesystem
  await removeAvatarFile(userId, currentProfile.avatar.filename);

  // Remove avatar from database
  const updatedProfile = await userService.removeUserAvatar(userId);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.AVATAR_REMOVED,
    data: {
      profile: updatedProfile,
    },
  });
});

/**
 * Update user profile (excluding avatar)
 * @route PATCH /api/profile
 * @access Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updates = req.body;

  // Validate profile data using Zod schema
  let validatedData;
  try {
    validatedData = validateProfileUpdate(updates);

    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.NO_VALID_UPDATES,
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Update profile
  const { Profile } = await import('../models/index.js');
  const updatedProfile = await Profile.findOneAndUpdate(
    { userId },
    { $set: validatedData },
    { new: true, upsert: true, runValidators: true },
  ).populate('userId', 'username email role isActive isEmailVerified avatar');

  // Format profile response to ensure bio and avatar are properly exposed
  const formattedProfile = userService.formatProfileResponse(updatedProfile);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.PROFILE_UPDATED,
    data: {
      profile: formattedProfile,
      user: updatedProfile.userId, // Include populated user data
    },
  });
});

export default {
  getProfile,
  uploadAvatar,
  removeAvatar,
  updateProfile,
};
