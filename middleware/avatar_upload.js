/**
 * Avatar Upload Middleware
 * Secure file upload handling with Multer for user avatars
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Use process.cwd() for Jest compatibility
// In production, this will resolve to the project root
const __dirname = process.cwd();

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Base uploads directory
const UPLOADS_BASE_DIR = path.join(__dirname, '..', 'uploads', 'avatars');

/**
 * Create user-specific directory if it doesn't exist
 * @param {string} userId - User ID for directory creation
 * @returns {Promise<string>} - Path to user directory
 */
async function ensureUserDirectory(userId) {
  const userDir = path.join(UPLOADS_BASE_DIR, userId);

  try {
    await fs.access(userDir);
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(userDir, { recursive: true });
  }

  return userDir;
}

/**
 * Remove old avatar files from user directory
 * @param {string} userId - User ID
 * @param {string} currentFilename - Current filename to keep (optional)
 */
async function removeOldAvatars(userId, currentFilename = null) {
  try {
    const userDir = path.join(UPLOADS_BASE_DIR, userId);
    const files = await fs.readdir(userDir);

    // Remove all files except the current one
    const deletePromises = files
      .filter(file => file !== currentFilename)
      .map(file => fs.unlink(path.join(userDir, file)).catch(() => {})); // Ignore errors

    await Promise.all(deletePromises);
  } catch {
    // Directory might not exist, ignore error silently
  }
}

/**
 * Generate secure filename with timestamp
 * @param {string} userId - User ID
 * @param {string} originalname - Original filename
 * @returns {string} - Secure filename
 */
function generateSecureFilename(userId, originalname) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalname).toLowerCase();

  // Sanitize and create secure filename
  return `avatar_${userId}_${timestamp}_${randomString}${extension}`;
}

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return cb(new Error('User authentication required for avatar upload'));
      }

      // Remove old avatars before uploading new one
      await removeOldAvatars(userId);

      // Ensure user directory exists
      const userDir = await ensureUserDirectory(userId);

      cb(null, userDir);
    } catch (error) {
      cb(error);
    }
  },

  filename: (req, file, cb) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return cb(new Error('User authentication required for avatar upload'));
      }

      const secureFilename = generateSecureFilename(userId, file.originalname);
      cb(null, secureFilename);
    } catch (error) {
      cb(error);
    }
  },
});

/**
 * File filter for security validation
 */
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }

  // Additional filename validation
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.svg'];

  if (!allowedExtensions.includes(extension)) {
    return cb(
      new Error(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`),
    );
  }

  // Check for suspicious filenames
  if (
    file.originalname.includes('..') ||
    file.originalname.includes('/') ||
    file.originalname.includes('\\')
  ) {
    return cb(new Error('Invalid filename detected'));
  }

  cb(null, true);
};

/**
 * Multer configuration
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only one file at a time
    fields: 0, // No additional fields
    parts: 1, // Only one part (the file)
  },
});

/**
 * Avatar upload middleware with error handling
 */
export const uploadAvatar = (req, res, next) => {
  const singleUpload = upload.single('avatar');

  singleUpload(req, res, error => {
    if (error instanceof multer.MulterError) {
      // Handle Multer-specific errors
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          return res.status(400).json({
            success: false,
            message: `File too large. Maximum size allowed is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          });
        case 'LIMIT_FILE_COUNT':
          return res.status(400).json({
            success: false,
            message: 'Only one file allowed per upload',
          });
        case 'LIMIT_UNEXPECTED_FILE':
          return res.status(400).json({
            success: false,
            message: 'Unexpected field name. Use "avatar" as field name',
          });
        default:
          return res.status(400).json({
            success: false,
            message: `Upload error: ${error.message}`,
          });
      }
    } else if (error) {
      // Handle custom validation errors
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // No file uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar file provided',
      });
    }

    next();
  });
};

/**
 * Get avatar URL for a user
 * @param {string} userId - User ID
 * @param {string} filename - Avatar filename
 * @returns {string} - Public avatar URL
 */
export function getAvatarUrl(userId, filename) {
  return `/uploads/avatars/${userId}/${filename}`;
}

/**
 * Get avatar file path
 * @param {string} userId - User ID
 * @param {string} filename - Avatar filename
 * @returns {string} - Full file path
 */
export function getAvatarPath(userId, filename) {
  return path.join(UPLOADS_BASE_DIR, userId, filename);
}

/**
 * Clean up avatar file
 * @param {string} userId - User ID
 * @param {string} filename - Avatar filename to remove
 */
export async function removeAvatarFile(userId, filename) {
  try {
    const filePath = getAvatarPath(userId, filename);
    await fs.unlink(filePath);
  } catch {
    // File might not exist, ignore error silently
  }
}

export default {
  uploadAvatar,
  getAvatarUrl,
  getAvatarPath,
  removeAvatarFile,
  removeOldAvatars,
};
