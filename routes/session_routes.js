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
import { validate, sessionIdSchema } from '../validations/index.js';

const router = express.Router();

// All session routes require authentication
router.use(protect);

router.get('/active', getActiveSessions);
router.get('/stats/devices', getDeviceStats);
router.get('/stats/locations', getLocationStats);
router.get('/security-overview', getSecurityOverview);
router.get('/:sessionId', validate(sessionIdSchema), getSessionDetails);
router.delete('/terminate-others', terminateOtherSessions);
router.delete('/:sessionId', validate(sessionIdSchema), terminateSession);

export default router;
