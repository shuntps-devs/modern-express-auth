import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../constants/index.js';

export const sessionIdSchema = z.object({
  params: z.object({
    sessionId: z
      .string()
      .min(24, VALIDATION_MESSAGES.SESSION_ID_INVALID)
      .max(24, VALIDATION_MESSAGES.SESSION_ID_INVALID)
      .regex(/^[0-9a-fA-F]{24}$/, VALIDATION_MESSAGES.SESSION_ID_INVALID),
  }),
});
