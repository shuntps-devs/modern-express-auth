export default {
  // Test environment
  testEnvironment: 'node',

  // Module type
  preset: null,
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },

  // Transform configuration for ES modules
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Test patterns - unit tests only (integration tests blocked by MongoMemoryServer)
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/unit/**/*.spec.js',
    // Integration tests disabled - MongoMemoryServer.create() blocks indefinitely
    // '**/tests/integration/**/*.test.js',
    // '**/tests/integration/**/*.spec.js',
  ],

  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    'validations/**/*.js',
    'config/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
  ],

  // Coverage thresholds (v1.1.0) - stable baseline for CI reliability
  coverageThreshold: {
    global: {
      branches: 42,
      functions: 51,
      lines: 54,
      statements: 54,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Test setup configuration
  setupFilesAfterEnv: ['<rootDir>/tests/unit-setup.js'],

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Detect open handles
  detectOpenHandles: true,

  // Force exit after tests
  forceExit: true,
};
