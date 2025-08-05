/**
 * Profile Validation Schemas
 * Zod schemas for profile-related operations
 */

import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../constants/index.js';

/**
 * Bio validation schema
 */
export const bioSchema = z
  .string()
  .trim()
  .max(500, VALIDATION_MESSAGES.BIO_TOO_LONG)
  .optional()
  .transform(val => val || ''); // Convert undefined/null to empty string

/**
 * Update profile schema - only includes fields that exist in Profile model
 */
export const profileUpdateSchema = z.object({
  bio: bioSchema,
});

/**
 * Validate bio only (for specific bio update operations)
 */
export const validateBio = bio => {
  try {
    return bioSchema.parse(bio);
  } catch (error) {
    throw new Error(error.errors[0]?.message || VALIDATION_MESSAGES.INVALID_BIO);
  }
};

/**
 * Validate profile update data
 */
export const validateProfileUpdate = data => {
  try {
    return profileUpdateSchema.parse(data);
  } catch (error) {
    const errorMessage = error.errors[0]?.message || VALIDATION_MESSAGES.INVALID_PROFILE_DATA;
    throw new Error(errorMessage);
  }
};
