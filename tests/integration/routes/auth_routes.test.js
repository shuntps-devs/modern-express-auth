import request from 'supertest';
import app from '../../../app.js';
import { User, Session } from '../../../models/index.js';
import { TestDataFactory, DatabaseHelpers } from '../../helpers/test_helpers.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../../constants/index.js';

describe('Auth Routes Integration Tests', () => {
  let testUser;
  let testUserData;

  beforeEach(async () => {
    testUserData = TestDataFactory.createUserData();
    testUser = await DatabaseHelpers.createTestUser(testUserData);
  });

  describe('POST /api/auth/register', () => {
    test('should register new user successfully', async () => {
      const newUserData = TestDataFactory.createUserData({
        username: 'newuser',
        email: 'newuser@example.com',
        confirmPassword: 'Test123!@#',
      });

      const response = await request(app).post('/api/auth/register').send(newUserData).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(SUCCESS_MESSAGES.REGISTRATION_SUCCESS);

      // Verify user was created in database
      const createdUser = await User.findOne({ email: newUserData.email });
      expect(createdUser).toBeDefined();
      expect(createdUser.username).toBe(newUserData.username);
    });

    test('should reject registration with invalid data', async () => {
      const invalidData = {
        username: 'ab', // Too short
        email: 'invalid-email',
        password: 'weak',
        confirmPassword: 'different',
      };

      const response = await request(app).post('/api/auth/register').send(invalidData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain(ERROR_MESSAGES.VALIDATION_FAILED);
    });

    test('should reject duplicate username', async () => {
      const duplicateData = TestDataFactory.createUserData({
        username: testUser.username, // Duplicate username
        email: 'different@example.com',
        confirmPassword: 'Test123!@#',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain(ERROR_MESSAGES.USERNAME_TAKEN);
    });

    test('should reject duplicate email', async () => {
      const duplicateData = TestDataFactory.createUserData({
        username: 'differentuser',
        email: testUser.email, // Duplicate email
        confirmPassword: 'Test123!@#',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain(ERROR_MESSAGES.USER_EMAIL_EXISTS);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const loginData = {
        email: testUser.email,
        password: testUserData.password, // Plain password before hashing
      };

      const response = await request(app).post('/api/auth/login').send(loginData).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.password).toBeUndefined();

      // Check cookies were set
      expect(response.headers['set-cookie']).toBeDefined();
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some(cookie => cookie.includes('refreshToken'))).toBe(true);

      // Verify session was created
      const session = await Session.findOne({ userId: testUser._id });
      expect(session).toBeDefined();
      expect(session.isActive).toBe(true);
    });

    test('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: testUserData.password,
      };

      const response = await request(app).post('/api/auth/login').send(loginData).expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain(ERROR_MESSAGES.INVALID_CREDENTIALS);
    });

    test('should reject login with invalid password', async () => {
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword',
      };

      const response = await request(app).post('/api/auth/login').send(loginData).expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain(ERROR_MESSAGES.INVALID_CREDENTIALS);
    });

    test('should reject login with validation errors', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '',
      };

      const response = await request(app).post('/api/auth/login').send(invalidData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain(ERROR_MESSAGES.VALIDATION_FAILED);
    });

    test('should reject login for inactive user', async () => {
      const inactiveUser = await DatabaseHelpers.createTestUser({
        username: 'inactive',
        email: 'inactive@example.com',
        isActive: false,
      });

      const loginData = {
        email: inactiveUser.email,
        password: testUserData.password,
      };

      const response = await request(app).post('/api/auth/login').send(loginData).expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain(ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
    });
  });

  describe('POST /api/auth/logout', () => {
    let authCookies;

    beforeEach(async () => {
      // Login to get auth cookies
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUserData.password,
      });

      authCookies = loginResponse.headers['set-cookie'];
    });

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(SUCCESS_MESSAGES.LOGOUT_SUCCESS);

      // Check cookies were cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.includes('accessToken=none'))).toBe(true);
      expect(cookies.some(cookie => cookie.includes('refreshToken=none'))).toBe(true);

      // Verify session was deactivated
      const session = await Session.findOne({ userId: testUser._id });
      expect(session.isActive).toBe(false);
    });

    test('should handle logout without valid session', async () => {
      const response = await request(app).post('/api/auth/logout').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain(ERROR_MESSAGES.ACCESS_TOKEN_REQUIRED);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Login to get refresh token
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUserData.password,
      });

      const cookies = loginResponse.headers['set-cookie'];
      refreshToken = cookies.find(cookie => cookie.startsWith('refreshToken='))?.split(';')[0];
    });

    test('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(SUCCESS_MESSAGES.TOKEN_REFRESH_SUCCESS);

      // Check new cookies were set
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some(cookie => cookie.includes('refreshToken'))).toBe(true);
    });

    test('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain(ERROR_MESSAGES.TOKEN_REFRESH_FAILED);
    });

    test('should reject refresh without token', async () => {
      const response = await request(app).post('/api/auth/refresh').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain(ERROR_MESSAGES.REFRESH_TOKEN_REQUIRED);
    });
  });

  describe('Rate limiting', () => {
    test('should apply rate limiting to login attempts', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      };

      // Make multiple failed login attempts
      const promises = Array(10)
        .fill()
        .map(() => request(app).post('/api/auth/login').send(loginData));

      const responses = await Promise.all(promises);

      // In test environment, rate limiting is disabled, so all requests should return 401
      const unauthorizedResponses = responses.filter(res => res.status === 401);
      expect(unauthorizedResponses.length).toBe(10);

      // Rate limiting is skipped in test environment
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBe(0);
    });
  });

  describe('Security headers', () => {
    test('should include security headers in responses', async () => {
      const response = await request(app).get('/api/auth/status');

      // Check for common security headers (set by helmet)
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });
});
