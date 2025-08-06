import dotenv from 'dotenv';
import { getEnvErrorMessage, getEnvDisplayMessage, getEnvExampleLine } from '../constants/index.js';

dotenv.config();

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
      {
        key: 'RESEND_API_KEY',
        description: 'Resend API key for email sending',
        example: 're_xxxxxxxxxxxxxxxxxxxxxxxxxx',
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
        key: 'FROM_EMAIL',
        description: 'Email address for sending emails',
        defaultValue: 'onboarding@resend.dev',
        example: 'onboarding@resend.dev',
      },
      {
        key: 'APP_NAME',
        description: 'Application name for emails',
        defaultValue: 'Express Auth API',
        example: 'Express Auth API',
      },
      {
        key: 'FRONTEND_URL',
        description: 'Frontend URL for email links',
        defaultValue: 'http://localhost:3000',
        example: 'http://localhost:3000',
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

  validate() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const missingEnvs = [];

    this.requiredEnvs.forEach(env => {
      if (!process.env[env.key] || process.env[env.key].trim() === '') {
        missingEnvs.push(env);
      }
    });

    if (missingEnvs.length > 0) {
      console.error('🚨 MISSING REQUIRED ENVIRONMENT VARIABLES');
      console.error('═'.repeat(70));

      for (const env of missingEnvs) {
        console.error(getEnvErrorMessage(env.key, env.description, env.example));
        console.error('');
      }

      console.error('═'.repeat(70));
      console.error('🔧 HOW TO FIX:');
      console.error('1. Create a .env file in your project root');
      console.error('2. Copy the variables from .env.example');
      console.error('3. Fill in the actual values for your environment');
      console.error('');
      console.error('📄 Example .env file content:');
      console.error('─'.repeat(30));

      for (const env of missingEnvs) {
        console.error(getEnvExampleLine(env.key, env.example));
      }

      console.error('─'.repeat(30));
      console.error('❌ Cannot start application without required environment variables');

      console.error('Application startup failed: Missing required environment variables:', {
        missingEnvs: missingEnvs.map(env => env.key),
      });

      process.exit(1);
    }

    this.validateSpecificEnvs();
  }

  validateSpecificEnvs() {
    const errors = [];

    if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
      errors.push('MONGODB_URI must start with "mongodb://" or "mongodb+srv://"');
    }
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET should be at least 32 characters long for security');
    }
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET should be at least 32 characters long for security');
    }
    if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
      errors.push('PORT must be a valid number');
    }

    const validNodeEnvs = ['development', 'production', 'test'];
    if (process.env.NODE_ENV && !validNodeEnvs.includes(process.env.NODE_ENV)) {
      errors.push(`NODE_ENV must be one of: ${validNodeEnvs.join(', ')}`);
    }

    if (errors.length > 0) {
      console.error('🚨 ENVIRONMENT VARIABLE VALIDATION ERRORS');
      console.error('═'.repeat(70));

      for (const error of errors) {
        console.error(`❌ ${error}`);
      }

      console.error('═'.repeat(70));
      console.error('❌ Cannot start application without required environment variables');

      console.error('Application startup failed: Invalid environment variable values:', { errors });

      process.exit(1);
    }
  }

  setDefaults() {
    this.optionalEnvs.forEach(env => {
      if (!process.env[env.key]) {
        process.env[env.key] = env.defaultValue;
      }
    });
  }

  getConfig() {
    return {
      PORT: parseInt(process.env.PORT),
      NODE_ENV: process.env.NODE_ENV,

      MONGODB_URI: process.env.MONGODB_URI,

      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,

      SESSION_SECRET: process.env.SESSION_SECRET,
      SESSION_EXPIRES_IN: process.env.SESSION_EXPIRES_IN,

      BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS),
      MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS),
      LOCK_TIME: parseInt(process.env.LOCK_TIME),

      RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
      RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),

      LOG_LEVEL: process.env.LOG_LEVEL,
      LOG_FILE: process.env.LOG_FILE,

      CORS_ORIGIN: process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()),

      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      isTest: process.env.NODE_ENV === 'test',
    };
  }

  displayConfig() {
    const config = this.getConfig();

    console.log('⚙️  Environment Configuration Loaded');
    console.log('═'.repeat(50));
    console.log(getEnvDisplayMessage('🌍 Environment', config.NODE_ENV));
    console.log(getEnvDisplayMessage('🚀 Port', config.PORT));
    console.log(getEnvDisplayMessage('📊 Log Level', config.LOG_LEVEL));
    console.log(getEnvDisplayMessage('🔒 CORS Origins', config.CORS_ORIGIN.join(', ')));
    console.log(getEnvDisplayMessage('🛡️  Max Login Attempts', config.MAX_LOGIN_ATTEMPTS));
    console.log(
      getEnvDisplayMessage(
        '⏰ Rate Limit',
        `${config.RATE_LIMIT_MAX_REQUESTS} requests per ${config.RATE_LIMIT_WINDOW_MS / 1000}s`,
      ),
    );
    console.log('═'.repeat(50));

    if (config.NODE_ENV === 'development') {
      console.log('🔍 Development mode: Detailed logging enabled');
    }

    console.log('');
  }
}

const envConfigInstance = new EnvConfig();

export const env = {
  ...envConfigInstance.getConfig(),
  displayConfig: () => envConfigInstance.displayConfig(),
};

export default envConfigInstance;
