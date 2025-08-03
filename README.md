# Express Authentication API 🚀

[![Tests](https://img.shields.io/badge/tests-115%20passing-brightgreen)](./tests/)
[![Coverage](https://img.shields.io/badge/coverage-55%25-yellow)](#testing)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/mongodb-%3E%3D5.0.0-brightgreen)](https://mongodb.com/)
[![GitHub](https://img.shields.io/badge/GitHub-shuntps%2Fmodern--express--auth-blue)](https://github.com/shuntps/modern-express-auth)

A **production-ready** Express.js authentication API with comprehensive security features, centralized message management, and extensive test coverage. Built with modern JavaScript, MongoDB, and industry best practices.

## ✨ Key Highlights

- 🔐 **Dual JWT Token System** (Access + Refresh tokens)
- 🛡️ **Advanced Security** (Rate limiting, account lockout, IP tracking)
- 📊 **171 Centralized Constants** (Zero hardcoded strings)
- ✅ **115 Passing Tests** (Unit + Integration + Validation)
- 📚 **Comprehensive Documentation** (API, Architecture, Development)
- 🏗️ **Clean Architecture** (Services, Controllers, Middleware separation)
- 🔍 **Professional Logging** (Winston with structured logging)
- ⚡ **Production Ready** (Error handling, validation, monitoring)

## 🚀 Features

### 🔒 Authentication & Security

- **JWT Authentication** with dual-token system (15min access, 7-day refresh)
- **Email Verification** with Resend integration and beautiful HTML templates
- **Session Management** with IP tracking and device fingerprinting
- **Account Security** with login attempt limiting and automatic lockout
- **Password Security** with bcrypt hashing (12 rounds) and strength validation
- **Role-Based Access Control** (User, Admin, Moderator)
- **Rate Limiting** with endpoint-specific limits
- **Security Headers** with Helmet middleware
- **CORS Protection** with configurable origins

### 📊 Data & Validation

- **Input Validation** with Zod schemas and custom validators
- **MongoDB Integration** with optimized indexes and queries
- **Centralized Constants** (171 constants, zero hardcoded strings)
- **Error Handling** with custom AppError class and global handler
- **Comprehensive Logging** with Winston (structured JSON logs)

### 🧪 Testing & Quality

- **115 Tests** covering all critical paths
- **Unit Tests** for services and utilities
- **Integration Tests** for API endpoints
- **Validation Tests** for Zod schemas
- **55% Code Coverage** across the codebase (with room for improvement)
- **ESLint & Prettier** for code quality

## 🛠️ Technology Stack

### Core Technologies

- **Node.js** (≥18.0.0) - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** (≥5.0.0) - NoSQL database
- **Mongoose** - MongoDB ODM with schema validation

### Authentication & Security

- **jsonwebtoken** - JWT token generation and verification
- **bcryptjs** - Password hashing and comparison
- **helmet** - Security headers middleware
- **express-rate-limit** - Rate limiting middleware
- **cors** - Cross-origin resource sharing
- **cookie-parser** - Cookie parsing and management

### Validation & Logging

- **zod** - TypeScript-first schema validation
- **winston** - Professional logging library
- **dotenv** - Environment variable management

### Testing & Development

- **jest** - Testing framework
- **supertest** - HTTP assertion library
- **eslint** - Code linting
- **prettier** - Code formatting

## 📋 Prerequisites

- **Node.js** ≥18.0.0
- **MongoDB** ≥5.0.0 (local or cloud)
- **npm** ≥8.0.0

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/shuntps/modern-express-auth.git
cd modern-express-auth
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/express-auth-api

# JWT Secrets (Generate secure keys!)
JWT_ACCESS_SECRET=your-super-secret-access-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session
SESSION_EXPIRY=7d

# Security
BCRYPT_ROUNDS=12
```

### 3. Start Services

```bash
# Start MongoDB (if local)
sudo systemctl start mongod
# OR with Docker: docker run -d -p 27017:27017 mongo:latest

# Start the API
npm run dev     # Development with hot reload
npm start       # Production mode
npm test        # Run test suite
```

### 4. Verify Installation

```bash
# Health check
curl http://localhost:3000/api/health

# Register a test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"SecurePass123!"}'
```

## 📚 Documentation

### 📖 Complete Documentation

- **[API Reference](./docs/API.md)** - Complete endpoint documentation
- **[Development Guide](./docs/DEVELOPMENT.md)** - Setup and development workflow
- **[Constants Documentation](./docs/CONSTANTS.md)** - Centralized constants system
- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System design and patterns
- **[Authentication Flow](./docs/AUTHENTICATION.md)** - Security implementation
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment

### 🔗 Quick API Reference

**Base URL:** `http://localhost:3000/api`

| Endpoint                | Method | Description            | Auth Required |
| ----------------------- | ------ | ---------------------- | ------------- |
| `/auth/register`        | POST   | Register new user      | ❌            |
| `/auth/login`           | POST   | User login             | ❌            |
| `/auth/logout`          | POST   | User logout            | ✅            |
| `/auth/refresh`         | POST   | Refresh access token   | ✅            |
| `/auth/forgot-password` | POST   | Request password reset | ❌            |
| `/auth/reset-password`  | POST   | Reset password         | ❌            |
| `/auth/change-password` | POST   | Change password        | ✅            |
| `/users/me`             | GET    | Get current user       | ✅            |
| `/users/profile`        | PUT    | Update profile         | ✅            |
| `/users/sessions`       | GET    | Get active sessions    | ✅            |
| `/admin/users`          | GET    | Get all users          | ✅ (Admin)    |

## 🧪 Testing

### Test Suite Overview

- **115 Tests** covering all critical functionality
- **90%+ Code Coverage** across the entire codebase
- **Unit Tests** for services, utilities, and helpers
- **Integration Tests** for API endpoints and middleware
- **Validation Tests** for Zod schemas and input validation

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- auth_controller.test.js

# Run tests in watch mode (development)
npm test -- --watch

# Run tests with verbose output
npm test -- --verbose
```

### Test Categories

- **Authentication Tests** (login, register, tokens, sessions)
- **User Management Tests** (profile, roles, permissions)
- **Middleware Tests** (auth, rate limiting, error handling)
- **Service Tests** (business logic, data operations)
- **Validation Tests** (input schemas, error messages)

## 📁 Project Structure

```
express-auth-api/
├── 📁 config/              # Configuration files
│   ├── database_config.js   # MongoDB connection
│   ├── env_config.js        # Environment variables
│   └── logger_config.js     # Winston logger setup
├── 📁 constants/           # Centralized constants (171 constants)
│   └── messages.js         # All messages and constants
├── 📁 controllers/         # Route controllers
│   ├── auth_controller.js  # Authentication logic
│   └── user_controller.js  # User management
├── 📁 docs/               # Comprehensive documentation
│   ├── API.md             # API reference
│   ├── DEVELOPMENT.md     # Development guide
│   └── CONSTANTS.md       # Constants documentation
├── 📁 middleware/         # Express middleware
│   ├── auth_middleware.js # Authentication & authorization
│   ├── error_handler.js   # Global error handling
│   └── rate_limiter.js    # Rate limiting
├── 📁 models/             # Mongoose models
│   ├── session_model.js   # User sessions
│   └── user_model.js      # User data
├── 📁 routes/             # API routes
│   ├── auth_routes.js     # Authentication endpoints
│   ├── index.js           # Route aggregation
│   └── user_routes.js     # User endpoints
├── 📁 services/           # Business logic layer
│   ├── auth_service.js    # Authentication services
│   └── user_service.js    # User services
├── 📁 tests/              # Test suites (115 tests)
│   ├── integration/       # API integration tests
│   ├── unit/             # Unit tests
│   └── helpers/          # Test utilities
├── 📁 utils/              # Utility functions
│   └── cookie_helper.js   # Cookie management
├── 📁 validations/        # Input validation
│   └── auth_validation.js # Zod schemas
└── server.js              # Application entry point
```

## 🚀 Production Deployment

### Environment Checklist

- [ ] Secure JWT secrets generated
- [ ] MongoDB connection configured
- [ ] Environment variables set
- [ ] Rate limiting configured
- [ ] CORS origins specified
- [ ] Logging level set to 'info'
- [ ] SSL/TLS certificates installed

### Deployment Commands

```bash
# Install production dependencies
npm ci --only=production

# Run security audit
npm audit

# Run all tests
npm test

# Start in production mode
NODE_ENV=production npm start
```

## 🤝 Contributing

Contributions are welcome! Please:

1. **Fork the repository** at [github.com/shuntps/modern-express-auth](https://github.com/shuntps/modern-express-auth)
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow the coding standards** (ESLint + Prettier)
4. **Add tests** for new functionality
5. **Ensure all tests pass** (`npm test`)
6. **Submit a pull request**

### 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/shuntps/modern-express-auth/issues) with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details

### Development Guidelines

- Follow the existing code style (ESLint + Prettier)
- Write tests for new features
- Update documentation as needed
- Use centralized constants for all messages
- Ensure all tests pass before submitting PR

## 📊 Performance & Monitoring

- **Winston Logging** with structured JSON logs
- **Rate Limiting** to prevent abuse
- **MongoDB Indexes** for optimized queries
- **Session Management** with automatic cleanup
- **Error Tracking** with detailed error messages
- **Security Monitoring** with login attempt tracking

## 🔐 Security Features

- **JWT Dual-Token System** (Access + Refresh)
- **Password Hashing** with bcrypt (12 rounds)
- **Account Lockout** after failed login attempts
- **IP-based Session Validation**
- **Rate Limiting** per endpoint
- **Security Headers** with Helmet
- **Input Validation** with Zod schemas
- **CORS Protection**
- **Cookie Security** (HttpOnly, Secure, SameSite)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern JavaScript and Node.js best practices
- Inspired by industry-standard authentication patterns
- Comprehensive testing approach for production readiness
- Centralized constants system for maintainability

---

**Made with ❤️ for secure, scalable authentication**

#### Get User Statistics (Admin Only)

```http
GET /api/user/admin/stats
Authorization: Bearer <admin-token>
```

## 🔒 Security Features

### Password Security

- Minimum 6 characters
- Must contain uppercase, lowercase, and number
- Bcrypt hashing with salt rounds of 12

### Account Protection

- Login attempt limiting (5 attempts)
- Account locking for 2 hours after failed attempts
- Session-based authentication with IP tracking

### Rate Limiting

- 100 requests per 15 minutes per IP
- Configurable through environment variables

### Security Headers

- Helmet.js for security headers
- Content Security Policy
- XSS Protection

## 📁 Project Structure

```
express-auth-api/
├── config/
│   ├── database.js          # Database configuration
│   └── logger.js            # Winston logger setup
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── errorHandler.js      # Error handling middleware
├── models/
│   └── User.js              # User model with sessions
├── routes/
│   ├── auth.js              # Authentication routes
│   └── user.js              # User management routes
├── utils/
│   ├── jwt.js               # JWT utilities
│   └── validation.js        # Zod validation schemas
├── logs/                    # Log files (auto-generated)
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
├── README.md               # This file
└── server.js               # Main application entry point
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/express-auth-api
JWT_SECRET=your-production-jwt-secret
PORT=5000
```

### Deployment Platforms

- **Heroku**: Ready for Heroku deployment
- **Railway**: Compatible with Railway
- **DigitalOcean**: App Platform ready
- **AWS**: EC2 or Elastic Beanstalk

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Shunt** - Full-stack developer specializing in JavaScript and modern web technologies.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need help, please open an issue in the GitHub repository.

---

**Happy Coding! 🚀**
