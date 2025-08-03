import { logger } from '../config/index.js';
import { AppError, asyncHandler } from '../middleware/index.js';
import { userService, emailService } from '../services/index.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/index.js';
import crypto from 'crypto';

// @desc    Verify email address
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(new AppError(ERROR_MESSAGES.EMAIL_VERIFICATION_TOKEN_INVALID, 400));
  }

  // Find user by verification token
  const user = await userService.findUserByEmailVerificationToken(token);

  if (!user) {
    return next(new AppError(ERROR_MESSAGES.EMAIL_VERIFICATION_TOKEN_INVALID, 400));
  }

  // Check if token is expired
  if (user.emailVerificationExpires < new Date()) {
    return next(new AppError(ERROR_MESSAGES.EMAIL_VERIFICATION_TOKEN_EXPIRED, 400));
  }

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

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.EMAIL_VERIFIED_SUCCESS,
  });
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

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.EMAIL_VERIFICATION_SENT,
  });
});

// @desc    Check email verification status
// @route   GET /api/auth/email-status
// @access  Private
export const checkEmailStatus = asyncHandler(async (req, res, _next) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    data: {
      isEmailVerified: user.isEmailVerified,
      email: user.email,
    },
  });
});
