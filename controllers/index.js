/**
 * Controllers Barrel Export
 * Centralizes all controller exports for easier imports
 */

// Auth Controller
export {
  register,
  login,
  logout,
  logoutAll,
  getMe,
  changePassword,
  getUserSessions,
  refreshToken,
  getAuthStatus,
  revokeSession,
  revokeAllSessions,
  cleanupSessions,
  getSecurityStatus,
  resetLoginAttempts,
  verifyToken,
  checkEmailStatus,
} from './auth_controller.js';

// Session Controller
export {
  getActiveSessions,
  getSessionDetails,
  getDeviceStats,
  getLocationStats,
  getSecurityOverview,
  terminateSession,
  terminateOtherSessions,
} from './session_controller.js';

// User Controller
export {
  getProfile,
  updateProfile,
  deleteAccount,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
} from './user_controller.js';

// Profile Controller
export {
  getProfile as getProfileController,
  updateProfile as updateProfileController,
  uploadAvatar as uploadAvatarController,
  removeAvatar,
} from './profile_controller.js';

// Email Verification Controller
export { verifyEmail, resendVerification } from './email_verification_controller.js';

// Individual function exports are available above - no default exports needed
