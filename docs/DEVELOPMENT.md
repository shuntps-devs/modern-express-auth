# Development Guide

[![GitHub](https://img.shields.io/badge/GitHub-shuntps%2Fmodern--express--auth-blue)](https://github.com/shuntps/modern-express-auth)

This guide covers the development setup, workflow, and best practices for the Express Authentication API.

**Repository:** [github.com/shuntps/modern-express-auth](https://github.com/shuntps/modern-express-auth)

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **MongoDB** >= 5.0.0
- **Git** for version control

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shuntps/modern-express-auth.git
cd modern-express-auth
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**
```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. **Run the application**
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📁 Project Structure

```
express-auth-api/
├── config/                 # Configuration files
│   ├── database_config.js   # MongoDB connection
│   ├── env_config.js        # Environment variables
│   └── logger_config.js     # Winston logger setup
├── constants/              # Centralized constants
│   └── messages.js         # All messages and constants
├── controllers/            # Route controllers
│   ├── auth_controller.js  # Authentication logic
│   └── user_controller.js  # User management
├── docs/                   # Documentation
├── middleware/             # Express middleware
│   ├── auth_middleware.js  # Authentication & authorization
│   ├── error_handler.js    # Error handling
│   └── rate_limiter.js     # Rate limiting
├── models/                 # Mongoose models
│   ├── session_model.js    # User sessions
│   └── user_model.js       # User data
├── routes/                 # API routes
│   ├── auth_routes.js      # Authentication endpoints
│   ├── index.js            # Route aggregation
│   └── user_routes.js      # User endpoints
├── services/               # Business logic
│   ├── auth_service.js     # Authentication services
│   └── user_service.js     # User services
├── tests/                  # Test suites
│   ├── integration/        # API integration tests
│   ├── unit/              # Unit tests
│   └── helpers/           # Test utilities
├── utils/                  # Utility functions
│   └── cookie_helper.js    # Cookie management
├── validations/            # Input validation
│   └── auth_validation.js  # Zod schemas
├── .env.example           # Environment template
├── package.json           # Dependencies & scripts
└── server.js              # Application entry point
```

## 🔧 Development Workflow

### Code Style & Quality
- **ESLint** for code linting
- **Prettier** for code formatting
- **Jest** for testing
- **Supertest** for API testing

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### Testing Strategy
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- auth_controller.test.js

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm run test:coverage
```

## 🛠️ Configuration

### Environment Variables (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/express-auth-api

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_EXPIRY=7d

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourapp.com

# Security
BCRYPT_ROUNDS=12
```

### Database Setup
```javascript
// MongoDB indexes are automatically created
// User indexes: email, username, role, isActive, etc.
// Session indexes: userId, expiresAt, ipAddress
```

## 🔍 Debugging

### Logger Levels
- `error` - Error conditions
- `warn` - Warning conditions  
- `info` - Informational messages
- `debug` - Debug-level messages

### Common Debug Commands
```bash
# Enable debug logging
DEBUG=* npm run dev

# MongoDB connection debug
DEBUG=mongoose npm run dev

# Test with verbose output
npm test -- --verbose
```

## 📊 Code Quality

### Linting
```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Testing Coverage
- **Target**: >90% code coverage
- **Current**: 115 tests passing
- **Areas**: Controllers, Services, Middleware, Validations

### Performance Monitoring
- Winston logging for performance tracking
- MongoDB query optimization
- Rate limiting implementation
- Memory usage monitoring

## 🚀 Deployment Preparation

### Build Process
```bash
# Install production dependencies only
npm ci --only=production

# Run security audit
npm audit

# Run all tests
npm test
```

### Environment Checklist
- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] JWT secrets are secure and unique
- [ ] Email service configured
- [ ] Rate limiting configured
- [ ] CORS settings appropriate
- [ ] Security headers enabled

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection string
echo $MONGODB_URI
```

**JWT Token Issues**
```bash
# Verify JWT secrets are set
echo $JWT_ACCESS_SECRET
echo $JWT_REFRESH_SECRET
```

**Test Failures**
```bash
# Clear test database
npm run test:clean

# Run tests with fresh database
npm test
```

**Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

## 📚 Additional Resources

- [API Documentation](./API.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Authentication Flow](./AUTHENTICATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Constants Documentation](./CONSTANTS.md)
