/**
 * Session Routes
 * Routes for session management with device and location information
 */

import express from 'express';
import {
  getActiveSessions,
  getSessionDetails,
  getDeviceStats,
  getLocationStats,
  getSecurityOverview,
  terminateSession,
  terminateOtherSessions,
} from '../controllers/index.js';
import { protect } from '../middleware/index.js';

const router = express.Router();

// All session routes require authentication
router.use(protect);

/**
 * @route   GET /api/sessions/active
 * @desc    Get all active sessions for current user with device and location info
 * @access  Private
 */
router.get('/active', getActiveSessions);

/**
 * @route   GET /api/sessions/stats/devices
 * @desc    Get device statistics for user sessions
 * @access  Private
 */
router.get('/stats/devices', getDeviceStats);

/**
 * @route   GET /api/sessions/stats/locations
 * @desc    Get location statistics for user sessions
 * @access  Private
 */
router.get('/stats/locations', getLocationStats);

/**
 * @route   GET /api/sessions/security-overview
 * @desc    Get security overview of all user sessions
 * @access  Private
 */
router.get('/security-overview', getSecurityOverview);

/**
 * @route   GET /api/sessions/:sessionId
 * @desc    Get detailed information about a specific session
 * @access  Private
 */
router.get('/:sessionId', getSessionDetails);

/**
 * @route   DELETE /api/sessions/terminate-others
 * @desc    Terminate all other sessions except current one
 * @access  Private
 */
router.delete('/terminate-others', terminateOtherSessions);

/**
 * @route   DELETE /api/sessions/:sessionId
 * @desc    Terminate a specific session
 * @access  Private
 */
router.delete('/:sessionId', terminateSession);

export default router;
