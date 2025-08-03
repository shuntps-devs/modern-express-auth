// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';

// Set test environment variables to avoid requiring real API keys
process.env.NODE_ENV = 'test';
process.env.RESEND_API_KEY = 'test_fake_key_for_testing';
process.env.FROM_EMAIL = 'test@example.com';
process.env.APP_NAME = 'Test App';
process.env.FRONTEND_URL = 'http://localhost:3000';

dotenv.config({ override: false, quiet: true });

import { testDbManager } from './helpers/database_manager.js';
import { env } from '../config/index.js';

// Note: Email service mocking is handled in individual test files to avoid conflicts

// Setup before all tests
beforeAll(async () => {
  // Connect to test database using dedicated manager
  await testDbManager.connect();

  // Set test environment
  env.NODE_ENV = 'test';
});

// Cleanup after each test
afterEach(async () => {
  // Clear collections using dedicated manager
  await testDbManager.clearCollections();
});

// Cleanup after all tests
afterAll(async () => {
  // Disconnect using dedicated manager
  await testDbManager.disconnect();
});

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in test environment (temporarily disabled for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
