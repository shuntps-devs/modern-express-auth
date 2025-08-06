import express from 'express';
import { protect, optionalAuth, authLimiter, readOnlyLimiter } from '../middleware/index.js';
import {
  validate,
  registerSchema,
  loginSchema,
  changePasswordSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from '../validations/index.js';
import {
  register,
  login,
  logout,
  logoutAll,
  changePassword,
  refreshToken,
  getAuthStatus,
  getSessions,
  revokeSession,
  revokeAllSessions,
  cleanupSessions,
  getSecurityStatus,
  resetLoginAttempts,
  verifyToken,
} from '../controllers/index.js';
import {
  verifyEmail,
  resendVerification,
  checkEmailStatus,
} from '../controllers/email_verification_controller.js';

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

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put(
  '/change-password',
  authLimiter,
  protect,
  validate(changePasswordSchema),
  changePassword,
);

// @desc    Get user sessions
// @route   GET /api/auth/sessions
// @access  Private
router.get('/sessions', readOnlyLimiter, protect, getSessions);

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

// @desc    Check authentication status
// @route   GET /api/auth/status
// @access  Public (with optional auth)
router.get('/status', readOnlyLimiter, optionalAuth, getAuthStatus);

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', readOnlyLimiter, protect, verifyToken);

// // @desc    Verify email address
// // @route   GET /api/auth/verify-email/:token
// // @access  Public
router.get('/verify-email/:token', validate(verifyEmailSchema), verifyEmail);

// // @desc    Resend email verification
// // @route   POST /api/auth/resend-verification
// // @access  Public
router.post(
  '/resend-verification',
  authLimiter,
  validate(resendVerificationSchema),
  resendVerification,
);

// // @desc    Check email verification status
// // @route   GET /api/auth/email-status
// // @access  Private
router.get('/email-status', readOnlyLimiter, protect, checkEmailStatus);

// Security Status Routes
// @desc    Get user security status (login attempts, lock status, last login)
// @route   GET /api/auth/security-status
// @access  Private
router.get('/security-status', readOnlyLimiter, protect, getSecurityStatus);

// @desc    Reset user login attempts (Admin only)
// @route   POST /api/auth/reset-login-attempts/:userId
// @access  Private (Admin)
router.post('/reset-login-attempts/:userId', authLimiter, protect, resetLoginAttempts);

export default router;
