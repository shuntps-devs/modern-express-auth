import dotenv from 'dotenv';
import { CONSOLE_MESSAGES, getEnvDisplayMessage, getEnvErrorMessage, getEnvExampleLine } from '../constants/messages.js';

// Load environment variables
dotenv.config();

/**
 * Environment Configuration with Validation
 * Centralizes all environment variables and validates their presence
 */
class EnvConfig {
  constructor() {
    this.requiredEnvs = [
      {
        key: 'MONGODB_URI',
        description: 'MongoDB connection string',
        example: 'mongodb://localhost:27017/express-auth-api',
      },
      {
        key: 'JWT_SECRET',
        description: 'Secret key for JWT token signing',
        example: 'your-super-secret-jwt-key-here',
      },
      {
        key: 'SESSION_SECRET',
        description: 'Secret key for session management',
        example: 'your-super-secret-session-key-here',
      },
    ];

    this.optionalEnvs = [
      {
        key: 'PORT',
        description: 'Server port number',
        defaultValue: '5000',
        example: '5000',
      },
      {
        key: 'NODE_ENV',
        description: 'Application environment',
        defaultValue: 'development',
        example: 'development',
      },
      {
        key: 'JWT_EXPIRES_IN',
        description: 'JWT access token expiration time',
        defaultValue: '15m',
        example: '15m',
      },
      {
        key: 'JWT_REFRESH_SECRET',
        description: 'Secret key for refresh token signing (optional, uses JWT_SECRET if not set)',
        defaultValue: '',
        example: 'your-super-secret-refresh-jwt-key-here',
      },
      {
        key: 'JWT_REFRESH_EXPIRES_IN',
        description: 'JWT refresh token expiration time',
        defaultValue: '7d',
        example: '7d',
      },
      {
        key: 'SESSION_EXPIRES_IN',
        description: 'Session expiration time',
        defaultValue: '30d',
        example: '30d',
      },
      {
        key: 'RATE_LIMIT_WINDOW_MS',
        description: 'Rate limiting window in milliseconds',
        defaultValue: '900000',
        example: '900000',
      },
      {
        key: 'RATE_LIMIT_MAX_REQUESTS',
        description: 'Maximum requests per window',
        defaultValue: '100',
        example: '100',
      },
      {
        key: 'LOG_LEVEL',
        description: 'Logging level',
        defaultValue: 'info',
        example: 'info',
      },
      {
        key: 'LOG_FILE',
        description: 'Log file path',
        defaultValue: 'logs/app.log',
        example: 'logs/app.log',
      },
      {
        key: 'BCRYPT_SALT_ROUNDS',
        description: 'Bcrypt salt rounds for password hashing',
        defaultValue: '12',
        example: '12',
      },
      {
        key: 'MAX_LOGIN_ATTEMPTS',
        description: 'Maximum login attempts before account lock',
        defaultValue: '5',
        example: '5',
      },
      {
        key: 'LOCK_TIME',
        description: 'Account lock time in milliseconds',
        defaultValue: '7200000',
        example: '7200000',
      },
      {
        key: 'CORS_ORIGIN',
        description: 'CORS allowed origins',
        defaultValue: 'http://localhost:3000',
        example: 'http://localhost:3000,https://yourdomain.com',
      },
    ];

    this.validate();
    this.setDefaults();
  }

  /**
   * Validate required environment variables
   */
  validate() {
    const missingEnvs = [];

    // Check required environment variables
    this.requiredEnvs.forEach((env) => {
      if (!process.env[env.key] || process.env[env.key].trim() === '') {
        missingEnvs.push(env);
      }
    });

    if (missingEnvs.length > 0) {
      console.error(CONSOLE_MESSAGES.ENV_MISSING_TITLE);
      console.error('═'.repeat(70));

      for (const env of missingEnvs) {
        console.error(getEnvErrorMessage(env.key, env.description, env.example));
        console.error('');
      }

      console.error('═'.repeat(70));
      console.error(CONSOLE_MESSAGES.ENV_HOW_TO_FIX);
      console.error(CONSOLE_MESSAGES.ENV_STEP_1);
      console.error(CONSOLE_MESSAGES.ENV_STEP_2);
      console.error(CONSOLE_MESSAGES.ENV_STEP_3);
      console.error('');
      console.error(CONSOLE_MESSAGES.ENV_EXAMPLE_FILE);
      console.error('─'.repeat(30));

      for (const env of missingEnvs) {
        console.error(getEnvExampleLine(env.key, env.example));
      }

      console.error('─'.repeat(30));
      console.error(CONSOLE_MESSAGES.ENV_CANNOT_START);

      // Log the error if logger is available
      try {
        logger.error(
          'Application startup failed: Missing required environment variables',
          {
            missingEnvs: missingEnvs.map((env) => env.key),
          }
        );
      } catch (logError) {
        // Logger might not be available yet
      }

      process.exit(1);
    }

    // Validate specific environment variable formats
    this.validateSpecificEnvs();
  }

  /**
   * Validate specific environment variable formats
   */
  validateSpecificEnvs() {
    const errors = [];

    // Validate MongoDB URI format
    if (
      process.env.MONGODB_URI &&
      !process.env.MONGODB_URI.startsWith('mongodb')
    ) {
      errors.push(
        'MONGODB_URI must start with "mongodb://" or "mongodb+srv://"'
      );
    }

    // Validate JWT_SECRET length
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      errors.push(
        'JWT_SECRET should be at least 32 characters long for security'
      );
    }

    // Validate SESSION_SECRET length
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
      errors.push(
        'SESSION_SECRET should be at least 32 characters long for security'
      );
    }

    // Validate PORT is a number
    if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
      errors.push('PORT must be a valid number');
    }

    // Validate NODE_ENV values
    const validNodeEnvs = ['development', 'production', 'test'];
    if (process.env.NODE_ENV && !validNodeEnvs.includes(process.env.NODE_ENV)) {
      errors.push(`NODE_ENV must be one of: ${validNodeEnvs.join(', ')}`);
    }

    if (errors.length > 0) {
      console.error(CONSOLE_MESSAGES.ENV_VALIDATION_ERRORS_TITLE);
      console.error('═'.repeat(70));

      for (const error of errors) {
        console.error(`❌ ${error}`);
      }

      console.error('═'.repeat(70));
      console.error(CONSOLE_MESSAGES.ENV_CANNOT_START);

      try {
        logger.error(
          'Application startup failed: Invalid environment variable values',
          { errors }
        );
      } catch (logError) {
        // Logger might not be available yet
      }

      process.exit(1);
    }
  }

  /**
   * Set default values for optional environment variables
   */
  setDefaults() {
    this.optionalEnvs.forEach((env) => {
      if (!process.env[env.key]) {
        process.env[env.key] = env.defaultValue;
      }
    });
  }

  /**
   * Get all environment configuration
   */
  getConfig() {
    return {
      // Server Configuration
      PORT: parseInt(process.env.PORT),
      NODE_ENV: process.env.NODE_ENV,

      // Database Configuration
      MONGODB_URI: process.env.MONGODB_URI,

      // JWT Configuration
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,

      // Session Configuration
      SESSION_SECRET: process.env.SESSION_SECRET,
      SESSION_EXPIRES_IN: process.env.SESSION_EXPIRES_IN,

      // Security Configuration
      BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS),
      MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS),
      LOCK_TIME: parseInt(process.env.LOCK_TIME),

      // Rate Limiting Configuration
      RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
      RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),

      // Logging Configuration
      LOG_LEVEL: process.env.LOG_LEVEL,
      LOG_FILE: process.env.LOG_FILE,

      // CORS Configuration
      CORS_ORIGIN: process.env.CORS_ORIGIN.split(',').map((origin) =>
        origin.trim()
      ),

      // Development flags
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      isTest: process.env.NODE_ENV === 'test',
    };
  }

  /**
   * Display configuration summary (safe for logging)
   */
  displayConfig() {
    const config = this.getConfig();

    console.log(CONSOLE_MESSAGES.ENV_CONFIG_LOADED);
    console.log('═'.repeat(50));
    console.log(getEnvDisplayMessage('🌍 Environment', config.NODE_ENV));
    console.log(getEnvDisplayMessage('🚀 Port', config.PORT));
    console.log(getEnvDisplayMessage('📊 Log Level', config.LOG_LEVEL));
    console.log(getEnvDisplayMessage('🔒 CORS Origins', config.CORS_ORIGIN.join(', ')));
    console.log(getEnvDisplayMessage('🛡️  Max Login Attempts', config.MAX_LOGIN_ATTEMPTS));
    console.log(
      getEnvDisplayMessage('⏰ Rate Limit', `${config.RATE_LIMIT_MAX_REQUESTS} requests per ${
        config.RATE_LIMIT_WINDOW_MS / 1000
      }s`)
    );
    console.log('═'.repeat(50));

    if (config.NODE_ENV === 'development') {
      console.log(CONSOLE_MESSAGES.DEV_MODE_DETAILED_LOGGING);
    }

    console.log('');
  }
}

// Create and export the configuration instance
const envConfigInstance = new EnvConfig();

// Set default values for optional environment variables
envConfigInstance.setDefaults();

// Export unified env object with all configuration
export const env = {
  // Configuration values
  ...envConfigInstance.getConfig(),

  // Utility methods
  displayConfig: () => envConfigInstance.displayConfig(),
  getConfig: () => envConfigInstance.getConfig(),
};

// Legacy exports for backward compatibility (can be removed later)
export const config = envConfigInstance.getConfig();
export default envConfigInstance;
