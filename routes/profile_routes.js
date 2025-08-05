/**
 * Profile Routes
 * Routes for user profile management including avatar upload
 */

import express from 'express';
import {
  uploadAvatar,
  protect,
  requireEmailVerification,
  avatarUploadLimiter,
} from '../middleware/index.js';
import {
  getProfileController as getProfile,
  uploadAvatarController,
  removeAvatar,
  updateProfileController as updateProfile,
} from '../controllers/index.js';

const router = express.Router();

// Apply authentication middleware to all profile routes
router.use(protect);
router.use(requireEmailVerification);

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/', getProfile);

/**
 * @route   PATCH /api/profile
 * @desc    Update user profile (excluding avatar)
 * @access  Private
 */
router.patch('/', updateProfile);

/**
 * @route   PATCH /api/profile/avatar
 * @desc    Upload/Update user avatar
 * @access  Private
 * @rateLimit 10 requests per hour
 */
router.patch('/avatar', avatarUploadLimiter, uploadAvatar, uploadAvatarController);

/**
 * @route   DELETE /api/profile/avatar
 * @desc    Remove user avatar
 * @access  Private
 * @rateLimit 10 requests per hour
 */
router.delete('/avatar', avatarUploadLimiter, removeAvatar);

export default router;
