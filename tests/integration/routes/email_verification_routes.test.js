import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import { User } from '../../../models/index.js';
import { emailService } from '../../../services/index.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../../helpers/test_helpers.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../constants/index.js';
import crypto from 'crypto';

// Mock email service
jest.mock('../../../services/email_service.js', () => ({
  sendEmailVerification: jest.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
  testConfiguration: jest.fn().mockResolvedValue(true),
}));

describe('Email Verification Routes Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('GET /api/auth/verify-email/:token', () => {
    it('should verify email with valid token', async () => {
      // Create user with verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      await user.save();

      const response = await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(SUCCESS_MESSAGES.EMAIL_VERIFIED_SUCCESS);

      // Check user is verified in database
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isEmailVerified).toBe(true);
      expect(updatedUser.emailVerificationToken).toBeUndefined();
      expect(updatedUser.emailVerificationExpires).toBeUndefined();

      // Check welcome email was sent
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith('test@example.com', 'testuser');
    });

    it('should return error for invalid token', async () => {
      const response = await request(app).get('/api/auth/verify-email/invalid-token').expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe(ERROR_MESSAGES.EMAIL_VERIFICATION_TOKEN_INVALID);
    });

    it('should return error for expired token', async () => {
      // Create user with expired verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() - 1000), // Expired
      });
      await user.save();

      const response = await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe(ERROR_MESSAGES.EMAIL_VERIFICATION_TOKEN_EXPIRED);
    });

    it('should return error for already verified email', async () => {
      // Create user with already verified email
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true, // Already verified
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      await user.save();

      const response = await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe(ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED);
    });

    it('should return error for missing token', async () => {
      await request(app).get('/api/auth/verify-email/').expect(404); // Route not found without token
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should resend verification email successfully', async () => {
      // Create unverified user
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: false,
      });
      await user.save();

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(SUCCESS_MESSAGES.EMAIL_VERIFICATION_SENT);

      // Check user has new verification token
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.emailVerificationToken).toBeDefined();
      expect(updatedUser.emailVerificationExpires).toBeDefined();
      expect(updatedUser.emailVerificationExpires.getTime()).toBeGreaterThan(Date.now());

      // Check email was sent
      expect(emailService.sendEmailVerification).toHaveBeenCalledWith(
        'test@example.com',
        'testuser',
        expect.any(String),
      );
    });

    it('should return error for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Email is required');
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe(ERROR_MESSAGES.USER_NOT_FOUND);
    });

    it('should return error for already verified email', async () => {
      // Create verified user
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
      });
      await user.save();

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe(ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED);
    });

    it('should handle email service failure', async () => {
      // Create unverified user
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: false,
      });
      await user.save();

      // Mock email service to fail
      emailService.sendEmailVerification.mockRejectedValueOnce(new Error('Email service error'));

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'test@example.com' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe(ERROR_MESSAGES.EMAIL_SEND_FAILED);
    });
  });

  describe('GET /api/auth/email-status', () => {
    it('should return email verification status for authenticated user', async () => {
      // Create and login user
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
      });
      await user.save();

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      // Extract access token from cookies
      const cookies = loginResponse.headers['set-cookie'];
      const accessTokenCookie = cookies.find(cookie => cookie.startsWith('accessToken='));
      const token = accessTokenCookie.split('=')[1].split(';')[0];

      const response = await request(app)
        .get('/api/auth/email-status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isEmailVerified).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return unverified status for unverified user', async () => {
      // Create and login unverified user
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: false,
      });
      await user.save();

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      // Extract access token from cookies
      const cookies = loginResponse.headers['set-cookie'];
      const accessTokenCookie = cookies.find(cookie => cookie.startsWith('accessToken='));
      const token = accessTokenCookie.split('=')[1].split(';')[0];

      const response = await request(app)
        .get('/api/auth/email-status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isEmailVerified).toBe(false);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return error for unauthenticated request', async () => {
      const response = await request(app).get('/api/auth/email-status').expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/email-status')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
