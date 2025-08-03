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
  refreshToken,
  verifyToken,
  getAuthStatus,
  getUserSessions,
  revokeSession,
  revokeAllSessions,
  cleanupSessions,
} from './auth_controller.js';

// Export controller functions
export * from './auth_controller.js';
export * from './user_controller.js';
export * from './email_verification_controller.js';

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

// Individual function exports are available above - no default exports needed
