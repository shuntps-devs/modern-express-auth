import { userService } from '../services/index.js';
import { getAvatarUrl, removeAvatarFile } from '../middleware/index.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/index.js';
import { logger } from '../config/index.js';
import { asyncHandler } from '../middleware/index.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/index.js';

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profile = await userService.getUserProfile(userId);

  if (!profile) {
    return sendErrorResponse(res, 404, ERROR_MESSAGES.PROFILE_NOT_FOUND);
  }

  const formattedProfile = userService.formatProfileResponse(profile);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.PROFILE_RETRIEVED, {
    profile: formattedProfile,
  });
});

// @desc    Upload/Update user avatar
// @route   PATCH /api/profile/avatar
// @access  Private
export const uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return sendErrorResponse(res, 400, ERROR_MESSAGES.AVATAR_UPLOAD_REQUIRED);
  }

  const avatarData = {
    url: getAvatarUrl(userId, req.file.filename),
    filename: req.file.filename,
  };

  const updatedProfile = await userService.updateUserAvatar(userId, avatarData);

  logger.info(`Avatar uploaded: ${req.user.email} from IP: ${req.ip}`);

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

// @desc    Remove user avatar
// @route   DELETE /api/profile/avatar
// @access  Private
export const removeAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const currentProfile = await userService.getUserProfile(userId);

  if (!currentProfile || !currentProfile.avatar?.filename) {
    return sendErrorResponse(res, 404, ERROR_MESSAGES.AVATAR_NOT_FOUND);
  }

  await removeAvatarFile(req.user._id, req.user.avatar);
  const updatedUser = await userService.removeUserAvatar(req.user._id);

  logger.info(`Avatar removed: ${req.user.email} from IP: ${req.ip}`);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.AVATAR_REMOVED, {
    user: userService.formatUserResponse(updatedUser, true),
  });
});

// @desc    Update user profile (excluding avatar)
// @route   PATCH /api/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const validatedData = req.body;

  const updatedProfile = await userService.updateUserProfile(userId, validatedData);
  const formattedProfile = userService.formatProfileResponse(updatedProfile);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.PROFILE_UPDATED, {
    profile: formattedProfile,
  });
});
