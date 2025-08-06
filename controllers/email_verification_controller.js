import crypto from 'crypto';
import { logger } from '../config/index.js';
import { asyncHandler } from '../middleware/index.js';
import { userService, emailService } from '../services/index.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/index.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/index.js';

// @desc    Verify email address
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await userService.findUserByEmailVerificationToken(token);

  if (!user) {
    return sendErrorResponse(res, 400, ERROR_MESSAGES.EMAIL_VERIFICATION_TOKEN_INVALID);
  }

  if (user.emailVerificationExpires < new Date()) {
    return sendErrorResponse(res, 400, ERROR_MESSAGES.EMAIL_VERIFICATION_TOKEN_EXPIRED);
  }

  if (user.isEmailVerified) {
    return sendErrorResponse(res, 400, ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED);
  }

  await userService.verifyUserEmail(user._id);

  try {
    await emailService.sendWelcomeEmail(user.email, user.username);
    logger.info(`Welcome email sent to ${user.email}`);
  } catch (error) {
    logger.error(`Failed to send welcome email to ${user.email}: ${error.message}`);
  }

  logger.info(`Email verified successfully for user: ${user.email}`);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.EMAIL_VERIFIED_SUCCESS);
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await userService.findUserByEmail(email);

  if (!user) {
    return sendErrorResponse(res, 404, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  if (user.isEmailVerified) {
    return sendErrorResponse(res, 400, ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED);
  }

  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await userService.updateEmailVerificationToken(user._id, {
    emailVerificationToken,
    emailVerificationExpires,
  });

  await emailService.sendEmailVerification(email, user.username, emailVerificationToken);
  logger.info(`Email verification resent to ${user.email}`);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.EMAIL_VERIFICATION_SENT);
});

// @desc    Check email verification status
// @route   GET /api/auth/email-status
// @access  Private
export const checkEmailStatus = asyncHandler(async (req, res) => {
  const user = await userService.findUserById(req.user._id);

  if (!user) {
    return sendErrorResponse(res, 404, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const formattedUser = userService.formatUserResponse(user);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.EMAIL_STATUS_RETRIEVED, {
    user: formattedUser,
    emailVerificationExpires: user.emailVerificationExpires,
    canResendVerification:
      !user.emailVerificationExpires || new Date() > user.emailVerificationExpires,
  });
});
