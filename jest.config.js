export default {
  // Test environment
  testEnvironment: 'node',
  
  // Module type
  preset: null,
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  
  // Transform configuration for ES modules
  transform: {},
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
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
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
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
