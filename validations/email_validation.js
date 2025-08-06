import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../constants/index.js';

// Resend email verification validation schema
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED)
    .email(VALIDATION_MESSAGES.EMAIL_INVALID)
    .toLowerCase()
    .trim(),
});

// Verify email token validation schema
export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, VALIDATION_MESSAGES.EMAIL_VERIFICATION_TOKEN_REQUIRED)
    .length(64, VALIDATION_MESSAGES.EMAIL_VERIFICATION_TOKEN_INVALID)
    .regex(/^[a-f0-9]+$/, VALIDATION_MESSAGES.EMAIL_VERIFICATION_TOKEN_INVALID),
});
