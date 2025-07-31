import express from 'express';
import { protect, optionalAuth, authLimiter, readOnlyLimiter } from '../middleware/index.js';
import { validate, registerSchema, loginSchema, changePasswordSchema } from '../validations/index.js';
import {
  register,
  login,
  logout,
  logoutAll,
  getMe,
  changePassword,
  refreshToken,
  verifyToken,
  getAuthStatus,
  getUserSessions,
  revokeSession,
  revokeAllSessions,
  cleanupSessions
} from '../controllers/index.js';

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', authLimiter, validate(registerSchema), register);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', authLimiter, validate(loginSchema), login);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, logout);

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
router.post('/logout-all', protect, logoutAll);

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', readOnlyLimiter, protect, getMe);

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', authLimiter, protect, validate(changePasswordSchema), changePassword);

// @desc    Get user sessions
// @route   GET /api/auth/sessions
// @access  Private
router.get('/sessions', readOnlyLimiter, protect, getUserSessions);

// @desc    Revoke a specific session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
router.delete('/sessions/:sessionId', protect, revokeSession);

// @desc    Revoke all user sessions except current
// @route   POST /api/auth/revoke-all
// @access  Private
router.post('/revoke-all', authLimiter, protect, revokeAllSessions);

// @desc    Cleanup expired sessions (Admin only)
// @route   POST /api/auth/cleanup
// @access  Private (Admin)
router.post('/cleanup', authLimiter, protect, cleanupSessions);

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', authLimiter, refreshToken);

// @desc    Verify access token validity
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', readOnlyLimiter, protect, verifyToken);

// @desc    Check authentication status
// @route   GET /api/auth/status
// @access  Public (with optional auth)
router.get('/status', readOnlyLimiter, optionalAuth, getAuthStatus);

export default router;
