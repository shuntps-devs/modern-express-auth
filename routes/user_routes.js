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
  userIdSchema,
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

router.get('/profile', readOnlyLimiter, getProfile);
router.put('/profile', profileLimiter, validate(updateProfileSchema), updateProfile);
router.delete('/profile', deleteAccount);

router.get(
  '/admin/users',
  adminLimiter,
  authorize('admin'),
  validateQuery(getUsersQuerySchema),
  getAllUsers,
);

router.get('/admin/users/:id', adminLimiter, authorize('admin'), validate(userIdSchema), getUserById);

router.put(
  '/admin/users/:id',
  adminLimiter,
  authorize('admin'),
  validate(userIdSchema),
  validate(adminUpdateUserSchema),
  updateUser,
);

router.delete('/admin/users/:id', adminLimiter, authorize('admin'), validate(userIdSchema), deleteUser);

router.get('/admin/stats', adminLimiter, authorize('admin'), getUserStats);

export default router;
