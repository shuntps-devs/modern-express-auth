// Unit Test Setup - No MongoDB dependency
// This setup is specifically for unit tests that don't need database connections

import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock console methods to reduce noise in unit tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000); // 10 seconds for unit tests

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
