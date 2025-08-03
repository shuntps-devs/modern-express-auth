import { Resend } from 'resend';
import { env } from '../config/index.js';
import { logger } from '../config/index.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/index.js';

class EmailService {
  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
    this.fromEmail = env.FROM_EMAIL || 'onboarding@resend.dev';
    this.appName = env.APP_NAME || 'Express Auth API';
    this.frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Send email verification email
   * @param {string} email - User email
   * @param {string} username - User username
   * @param {string} verificationToken - Email verification token
   * @returns {Promise<Object>} - Email send result
   */
  async sendEmailVerification(email, username, verificationToken) {
    try {
      const verificationUrl = `${this.frontendUrl}/verify-email/${verificationToken}`;

      const emailData = {
        from: `${this.appName} <${this.fromEmail}>`,
        to: [email],
        subject: `Verify your email address - ${this.appName}`,
        html: this.getEmailVerificationTemplate(username, verificationUrl),
      };

      const result = await this.resend.emails.send(emailData);

      logger.info('Email verification sent successfully', {
        email,
        messageId: result.data?.id,
        service: 'resend',
      });

      return {
        success: true,
        messageId: result.data?.id,
        message: SUCCESS_MESSAGES.EMAIL_VERIFICATION_SENT,
      };
    } catch (error) {
      logger.error('Failed to send email verification', {
        email,
        error: error.message,
        service: 'resend',
      });

      throw new Error(ERROR_MESSAGES.EMAIL_SEND_FAILED);
    }
  }

  /**
   * Send welcome email after email verification
   * @param {string} email - User email
   * @param {string} username - User username
   * @returns {Promise<Object>} - Email send result
   */
  async sendWelcomeEmail(email, username) {
    try {
      const emailData = {
        from: `${this.appName} <${this.fromEmail}>`,
        to: [email],
        subject: `Welcome to ${this.appName}!`,
        html: this.getWelcomeEmailTemplate(username),
      };

      const result = await this.resend.emails.send(emailData);

      logger.info('Welcome email sent successfully', {
        email,
        messageId: result.data?.id,
        service: 'resend',
      });

      return {
        success: true,
        messageId: result.data?.id,
        message: SUCCESS_MESSAGES.WELCOME_EMAIL_SENT,
      };
    } catch (error) {
      logger.error('Failed to send welcome email', {
        email,
        error: error.message,
        service: 'resend',
      });

      // Don't throw error for welcome email failure
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get email verification HTML template
   * @param {string} username - User username
   * @param {string} verificationUrl - Verification URL
   * @returns {string} - HTML template
   */
  getEmailVerificationTemplate(username, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${this.appName}</h1>
        </div>
        <div class="content">
          <h2>Welcome ${username}!</h2>
          <p>Thank you for signing up with ${this.appName}. To complete your registration, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
          
          <p><strong>This link will expire in 24 hours.</strong></p>
          
          <p>If you didn't create an account with us, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 ${this.appName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get welcome email HTML template
   * @param {string} username - User username
   * @returns {string} - HTML template
   */
  getWelcomeEmailTemplate(username) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to ${this.appName}!</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>Your email has been successfully verified and your account is now active.</p>
          
          <p>You can now enjoy all the features of ${this.appName}:</p>
          <ul>
            <li>Secure authentication</li>
            <li>Profile management</li>
            <li>And much more!</li>
          </ul>
          
          <p>If you have any questions or need help, feel free to contact our support team.</p>
          
          <p>Thank you for joining us!</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 ${this.appName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Test email configuration
   * @returns {Promise<boolean>} - Configuration test result
   */
  async testConfiguration() {
    try {
      if (!env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
      }

      logger.info('Email service configuration is valid', {
        service: 'resend',
        fromEmail: this.fromEmail,
      });

      return true;
    } catch (error) {
      logger.error('Email service configuration test failed', {
        error: error.message,
        service: 'resend',
      });

      return false;
    }
  }
}

// Create and export singleton instance
const emailService = new EmailService();
export default emailService;
