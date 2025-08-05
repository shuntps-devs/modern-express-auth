import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../constants/index.js';

// Update profile validation schema
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, VALIDATION_MESSAGES.USERNAME_MIN_LENGTH)
    .max(30, VALIDATION_MESSAGES.USERNAME_MAX_LENGTH)
    .regex(/^[a-zA-Z0-9_-]+$/, VALIDATION_MESSAGES.USERNAME_INVALID_CHARS)
    .optional(),

  email: z
    .email(VALIDATION_MESSAGES.EMAIL_INVALID)
    .transform(val => val.toLowerCase())
    .optional(),
});

// Admin update user validation schema
export const adminUpdateUserSchema = z.object({
  role: z
    .enum(['user', 'admin', 'moderator'], {
      errorMap: () => ({ message: VALIDATION_MESSAGES.ROLE_INVALID }),
    })
    .optional(),

  isActive: z
    .boolean({
      errorMap: () => ({ message: VALIDATION_MESSAGES.IS_ACTIVE_INVALID }),
    })
    .optional(),

  isEmailVerified: z
    .boolean({
      errorMap: () => ({ message: VALIDATION_MESSAGES.IS_EMAIL_VERIFIED_INVALID }),
    })
    .optional(),
});

// Query parameters validation for user list
export const getUsersQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, VALIDATION_MESSAGES.PAGE_REQUIRED)
    .transform(val => parseInt(val))
    .refine(val => val > 0, VALIDATION_MESSAGES.PAGE_MIN_VALUE)
    .optional(),

  limit: z
    .string()
    .regex(/^\d+$/, VALIDATION_MESSAGES.LIMIT_REQUIRED)
    .transform(val => parseInt(val))
    .refine(val => val > 0 && val <= 100, VALIDATION_MESSAGES.LIMIT_RANGE)
    .optional(),

  role: z
    .enum(['user', 'admin', 'moderator'], {
      errorMap: () => ({ message: VALIDATION_MESSAGES.ROLE_INVALID }),
    })
    .optional(),

  isActive: z
    .string()
    .regex(/^(true|false)$/, VALIDATION_MESSAGES.IS_ACTIVE_QUERY_INVALID)
    .transform(val => val === 'true')
    .optional(),

  search: z
    .string()
    .min(1, VALIDATION_MESSAGES.SEARCH_TERM_REQUIRED)
    .max(100, VALIDATION_MESSAGES.SEARCH_TERM_MAX_LENGTH)
    .optional(),
});
