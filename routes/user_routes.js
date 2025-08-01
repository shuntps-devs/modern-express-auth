import express from 'express';
import {
  protect,
  authorize,
  profileLimiter,
  readOnlyLimiter,
  adminLimiter,
} from '../middleware/index.js';
import {
  validate,
  validateQuery,
  updateProfileSchema,
  adminUpdateUserSchema,
  getUsersQuerySchema,
} from '../validations/index.js';
import {
  getProfile,
  updateProfile,
  deleteAccount,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
} from '../controllers/index.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
router.get('/profile', readOnlyLimiter, getProfile);

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
router.put('/profile', profileLimiter, validate(updateProfileSchema), updateProfile);

// @desc    Delete user account
// @route   DELETE /api/user/profile
// @access  Private
router.delete('/profile', deleteAccount);

// Admin only routes
// @desc    Get all users
// @route   GET /api/user/admin/users
// @access  Private/Admin
router.get(
  '/admin/users',
  adminLimiter,
  authorize('admin'),
  validateQuery(getUsersQuerySchema),
  getAllUsers,
);

// @desc    Get single user (Admin)
// @route   GET /api/user/admin/users/:id
// @access  Private/Admin
router.get('/admin/users/:id', adminLimiter, authorize('admin'), getUserById);

// @desc    Update user (Admin)
// @route   PUT /api/user/admin/users/:id
// @access  Private/Admin
router.put(
  '/admin/users/:id',
  adminLimiter,
  authorize('admin'),
  validate(adminUpdateUserSchema),
  updateUser,
);

// @desc    Delete user (Admin)
// @route   DELETE /api/user/admin/users/:id
// @access  Private/Admin
router.delete('/admin/users/:id', adminLimiter, authorize('admin'), deleteUser);

// @desc    Get user statistics (Admin)
// @route   GET /api/user/admin/stats
// @access  Private/Admin
router.get('/admin/stats', adminLimiter, authorize('admin'), getUserStats);

export default router;
