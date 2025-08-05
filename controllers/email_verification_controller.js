import { logger } from '../config/index.js';
import { AppError, asyncHandler } from '../middleware/index.js';
import { userService, emailService } from '../services/index.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/index.js';
import { User } from '../models/index.js';
import crypto from 'crypto';
import { sendSuccessResponse } from '../utils/index.js';

// @desc    Verify email address
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(new AppError(ERROR_MESSAGES.EMAIL_VERIFICATION_TOKEN_INVALID, 400));
  }

  // First, find user by token without expiration filter to check if token exists
  const userWithToken = await User.findOne({ emailVerificationToken: token });

  if (!userWithToken) {
    return next(new AppError(ERROR_MESSAGES.EMAIL_VERIFICATION_TOKEN_INVALID, 400));
  }

  // Check if token is expired
  if (userWithToken.emailVerificationExpires < new Date()) {
    return next(new AppError(ERROR_MESSAGES.EMAIL_VERIFICATION_TOKEN_EXPIRED, 400));
  }

  // Now use the service method to get the user (this will work since token is not expired)
  const user = userWithToken;

  // Check if email is already verified
  if (user.isEmailVerified) {
    return next(new AppError(ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED, 400));
  }

  // Update user verification status
  await userService.verifyUserEmail(user._id);

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user.email, user.username);
    logger.info(`Welcome email sent to ${user.email}`);
  } catch (error) {
    logger.error(`Failed to send welcome email to ${user.email}: ${error.message}`);
    // Continue even if welcome email fails
  }

  logger.info(`Email verified successfully for user: ${user.email}`);

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.EMAIL_VERIFIED_SUCCESS);
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  // Find user by email
  const user = await userService.findUserByEmail(email);

  if (!user) {
    return next(new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404));
  }

  // Check if email is already verified
  if (user.isEmailVerified) {
    return next(new AppError(ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED, 400));
  }

  // Generate new verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Update user with new token
  await userService.updateEmailVerificationToken(user._id, {
    emailVerificationToken,
    emailVerificationExpires,
  });

  // Send verification email
  try {
    await emailService.sendEmailVerification(email, user.username, emailVerificationToken);
    logger.info(`Email verification resent to ${user.email}`);
  } catch (error) {
    logger.error(`Failed to resend verification email to ${user.email}: ${error.message}`);
    return next(new AppError(ERROR_MESSAGES.EMAIL_SEND_FAILED, 500));
  }

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.EMAIL_VERIFICATION_SENT);
});

// @desc    Check email verification status
// @route   GET /api/auth/email-status
// @access  Private
export const checkEmailStatus = asyncHandler(async (req, res, _next) => {
  const user = req.user;

  return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.EMAIL_STATUS_RETRIEVED, {
    isEmailVerified: user.isEmailVerified,
    email: user.email,
  });
});
