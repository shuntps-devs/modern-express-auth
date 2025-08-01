import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../constants/index.js';

// User registration validation schema
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, VALIDATION_MESSAGES.USERNAME_REQUIRED)
      .trim()
      .min(3, VALIDATION_MESSAGES.USERNAME_MIN_LENGTH)
      .max(30, VALIDATION_MESSAGES.USERNAME_MAX_LENGTH)
      .regex(/^[a-zA-Z0-9_-]+$/, VALIDATION_MESSAGES.USERNAME_INVALID_CHARS),

    email: z
      .string()
      .trim()
      .email(VALIDATION_MESSAGES.EMAIL_INVALID)
      .transform(val => val.toLowerCase()),

    password: z
      .string()
      .min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED)
      .min(8, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
      .regex(/^(?=.*[a-z])/, VALIDATION_MESSAGES.PASSWORD_LOWERCASE_REQUIRED)
      .regex(/^(?=.*[A-Z])/, VALIDATION_MESSAGES.PASSWORD_UPPERCASE_REQUIRED)
      .regex(/^(?=.*\d)/, VALIDATION_MESSAGES.PASSWORD_NUMBER_REQUIRED)
      .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, VALIDATION_MESSAGES.PASSWORD_SPECIAL_CHAR_REQUIRED),

    confirmPassword: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_CONFIRM_REQUIRED),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: VALIDATION_MESSAGES.PASSWORDS_DO_NOT_MATCH,
    path: ['confirmPassword'],
  })
  .transform(({ confirmPassword: _confirmPassword, ...rest }) => rest);

// User login validation schema
export const loginSchema = z.object({
  email: z.email(VALIDATION_MESSAGES.EMAIL_INVALID).transform(val => val.toLowerCase()),

  password: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED),
});

// Change password validation schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, VALIDATION_MESSAGES.CURRENT_PASSWORD_REQUIRED),

    newPassword: z
      .string()
      .min(8, VALIDATION_MESSAGES.PASSWORD_NEW_MIN_LENGTH)
      .regex(/^(?=.*[a-z])/, VALIDATION_MESSAGES.PASSWORD_LOWERCASE_REQUIRED)
      .regex(/^(?=.*[A-Z])/, VALIDATION_MESSAGES.PASSWORD_UPPERCASE_REQUIRED)
      .regex(/^(?=.*\d)/, VALIDATION_MESSAGES.PASSWORD_NUMBER_REQUIRED)
      .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, VALIDATION_MESSAGES.PASSWORD_SPECIAL_CHAR_REQUIRED),

    confirmNewPassword: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_CONFIRM_REQUIRED),
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: VALIDATION_MESSAGES.PASSWORDS_DO_NOT_MATCH,
    path: ['confirmNewPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: VALIDATION_MESSAGES.PASSWORD_MUST_BE_DIFFERENT,
    path: ['newPassword'],
  })
  .transform(({ confirmNewPassword: _confirmNewPassword, ...rest }) => rest);

// Forgot password validation schema
export const forgotPasswordSchema = z.object({
  email: z.email(VALIDATION_MESSAGES.EMAIL_INVALID).transform(val => val.toLowerCase()),
});

// Reset password validation schema
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, VALIDATION_MESSAGES.RESET_TOKEN_REQUIRED),

    newPassword: z
      .string()
      .min(8, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
      .regex(/^(?=.*[a-z])/, VALIDATION_MESSAGES.PASSWORD_LOWERCASE_REQUIRED)
      .regex(/^(?=.*[A-Z])/, VALIDATION_MESSAGES.PASSWORD_UPPERCASE_REQUIRED)
      .regex(/^(?=.*\d)/, VALIDATION_MESSAGES.PASSWORD_NUMBER_REQUIRED)
      .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, VALIDATION_MESSAGES.PASSWORD_SPECIAL_CHAR_REQUIRED),

    confirmNewPassword: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_CONFIRM_REQUIRED),
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: VALIDATION_MESSAGES.PASSWORDS_DO_NOT_MATCH,
    path: ['confirmNewPassword'],
  });
