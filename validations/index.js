/**
 * Validations Barrel Export
 * Centralizes all validation exports for easier imports
 */

import { z } from 'zod';
import { ERROR_MESSAGES, VALIDATION_TYPES } from '../constants/messages.js';

// Pre-configured validation middleware for common use cases
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth_validation.js';
import { updateUserSchema, createUserSchema } from './user_validation.js';

// Re-export validation schemas
export * from './auth_validation.js';
export * from './user_validation.js';

// Auth validation middleware
export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
export const validateChangePassword = validate(changePasswordSchema);
export const validateForgotPassword = validate(forgotPasswordSchema);
export const validateResetPassword = validate(resetPasswordSchema);

// User validation middleware
export const validateUpdateUser = validate(updateUserSchema);
export const validateCreateUser = validate(createUserSchema);

// Validation middleware factory
export const validate = schema => {
  return (req, res, next) => {
    try {
      // Check if request body exists
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.REQUEST_BODY_REQUIRED,
            type: VALIDATION_TYPES.MISSING_BODY,
          },
        });
      }

      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Use error.issues for Zod v4+ (not error.errors)
        const errors = (error.issues || []).map(err => ({
          field: err.path ? err.path.join('.') : VALIDATION_TYPES.UNKNOWN_FIELD,
          message: err.message || ERROR_MESSAGES.INVALID_VALUE,
        }));

        return res.status(400).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.VALIDATION_FAILED,
            type: VALIDATION_TYPES.VALIDATION_ERROR,
            details: errors,
          },
        });
      }
      next(error);
    }
  };
};

// Query validation middleware factory
export const validateQuery = schema => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.QUERY_VALIDATION_FAILED,
            details: errors,
          },
        });
      }
      next(error);
    }
  };
};
