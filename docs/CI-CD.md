# CI/CD Pipeline Documentation

[![GitHub](https://img.shields.io/badge/GitHub-shuntps%2Fmodern--express--auth-blue)](https://github.com/shuntps/modern-express-auth)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-brightgreen)](https://github.com/shuntps/modern-express-auth/actions)

Comprehensive guide to the Continuous Integration and Continuous Deployment pipeline for the Express Authentication API.

**Repository:** [github.com/shuntps/modern-express-auth](https://github.com/shuntps/modern-express-auth)  
**Actions:** [github.com/shuntps/modern-express-auth/actions](https://github.com/shuntps/modern-express-auth/actions)

## 🚀 Pipeline Overview

The project includes a comprehensive CI/CD pipeline with three main workflows:

### 1. **Main CI/CD Pipeline** (`.github/workflows/ci.yml`)

- **Triggers**: Push/PR to `main` and `develop` branches
- **Node.js versions**: 18.x, 20.x (matrix testing)
- **Database**: MongoDB 7.0 with health checks
- **Stages**: Test → Build → Deploy

### 2. **Security Audit** (`.github/workflows/security.yml`)

- **Triggers**: Daily at 2 AM UTC, push to `main`, PRs
- **Features**: npm audit, dependency review, vulnerability scanning

### 3. **Code Quality** (`.github/workflows/code-quality.yml`)

- **Triggers**: Push/PR to `main` and `develop` branches
- **Features**: ESLint, Prettier, dependency checks, code analysis

## 🔧 Pipeline Stages

### Testing Stage

```yaml
- Checkout code
- Setup Node.js (18.x, 20.x)
- Install dependencies
- Create test environment
- Run linting (ESLint)
- Check formatting (Prettier)
- Run unit tests
- Run integration tests
- Generate coverage report
- Upload to Codecov
```

### Build Stage

```yaml
- Checkout code
- Setup Node.js 20.x
- Install dependencies
- Build application
- Run security audit
```

### Deploy Stage

```yaml
- Deploy to staging/production
- Send deployment notifications
```

## 📊 Quality Gates

### Code Quality Requirements

- **ESLint**: All rules must pass
- **Prettier**: Code must be properly formatted
- **Tests**: All 115 tests must pass
- **Coverage**: Minimum thresholds configured
- **Security**: No high/critical vulnerabilities

### Coverage Thresholds

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

## 🛡️ Security Features

### Automated Security Checks

- **npm audit**: Daily vulnerability scanning
- **Dependency review**: PR-based dependency analysis
- **Known vulnerabilities**: audit-ci integration
- **Package validation**: Ensure package integrity

### Security Workflow Features

- **Scheduled scans**: Daily at 2 AM UTC
- **PR integration**: Security review on pull requests
- **Severity levels**: Fail on moderate+ vulnerabilities
- **Audit fixes**: Dry-run audit fix suggestions

## 🔍 Code Quality Checks

### Linting & Formatting

- **ESLint**: Comprehensive rule set with modern JS standards
- **Prettier**: Consistent code formatting
- **Unused dependencies**: depcheck integration
- **Package validation**: validate-package-name

### Additional Quality Checks

- **TODO/FIXME detection**: Identify technical debt
- **Console statement detection**: Ensure proper logging usage
- **Type checking**: Additional code validation

## 📈 Monitoring & Reporting

### Coverage Reporting

- **Codecov integration**: Automatic coverage uploads
- **Multiple formats**: lcov, html, json-summary
- **PR comments**: Coverage diff reporting
- **Trend tracking**: Historical coverage data

### Test Reporting

- **Verbose output**: Detailed test results
- **Matrix testing**: Multiple Node.js versions
- **Timeout handling**: 30-second test timeout
- **Clean exit**: Proper test cleanup

## 🚀 Deployment Pipeline

### Environment Strategy

- **Staging**: Automatic deployment from `main`
- **Production**: Manual approval process
- **Feature branches**: No deployment
- **PR previews**: Optional preview deployments

### Deployment Steps

1. **Pre-deployment checks**: All tests pass, security clear
2. **Build verification**: Application builds successfully
3. **Staging deployment**: Automatic deployment to staging
4. **Production deployment**: Manual approval required
5. **Post-deployment**: Health checks and notifications

## 🔧 Configuration Files

### ESLint Configuration (`.eslintrc.js`)

```javascript
export default {
  env: { browser: true, es2021: true, node: true, jest: true },
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'prefer-const': 'error',
    // ... additional rules
  },
};
```

### Prettier Configuration (`.prettierrc`)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Jest Configuration (`jest.config.js`)

```javascript
export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['controllers/**/*.js', 'services/**/*.js'],
  coverageThreshold: { global: { branches: 80, functions: 80 } },
};
```

## 📋 Available Scripts

### Development Scripts

```bash
npm run dev          # Start development server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check formatting
```

### Testing Scripts

```bash
npm test             # Run all tests
npm run test:unit    # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:coverage    # Run tests with coverage
npm run test:watch       # Run tests in watch mode
```

### Production Scripts

```bash
npm start            # Start production server
npm run build        # Build application
npm audit            # Security audit
```

## 🚨 Troubleshooting

### Common CI/CD Issues

**Tests failing in CI but passing locally:**

- Check Node.js version compatibility
- Verify environment variables
- Check MongoDB connection

**Coverage threshold failures:**

- Review uncovered code paths
- Add missing test cases
- Update thresholds if appropriate

**Security audit failures:**

- Run `npm audit fix`
- Update vulnerable dependencies
- Review security advisories

**Linting failures:**

- Run `npm run lint:fix`
- Check ESLint configuration
- Review code style guidelines

### Pipeline Debugging

**View detailed logs:**

- Check GitHub Actions tab
- Review individual step outputs
- Check artifact uploads

**Local testing:**

```bash
# Test the same commands locally
npm ci
npm run lint
npm run format:check
npm run test:coverage
npm audit
```

## 🔄 Continuous Improvement

### Pipeline Enhancements

- **Performance optimization**: Cache dependencies, parallel jobs
- **Advanced security**: SAST/DAST integration
- **Deployment strategies**: Blue-green, canary deployments
- **Monitoring integration**: APM, error tracking

### Quality Improvements

- **Code complexity analysis**: ESLint complexity rules
- **Performance testing**: Load testing integration
- **Accessibility testing**: Automated a11y checks
- **Documentation**: Auto-generated API docs

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Testing Framework](https://jestjs.io/)
- [ESLint Configuration](https://eslint.org/docs/user-guide/configuring/)
- [Prettier Code Formatter](https://prettier.io/docs/en/configuration.html)
- [Codecov Integration](https://docs.codecov.com/docs)

---

**The CI/CD pipeline ensures code quality, security, and reliability for every change to the Express Authentication API.**
