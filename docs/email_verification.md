# Email Verification Documentation

## Overview

The Express Auth API now includes comprehensive email verification functionality using the Resend email service. This feature ensures that users verify their email addresses during registration, enhancing security and reducing spam accounts.

## Features

- ✅ **Email verification during registration**
- ✅ **Resend verification email functionality**
- ✅ **Email verification status checking**
- ✅ **Welcome email after verification**
- ✅ **Middleware to protect routes requiring verified emails**
- ✅ **Beautiful HTML email templates**
- ✅ **Configurable email settings**

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```bash
# Required
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional (with defaults)
FROM_EMAIL=onboarding@resend.dev
APP_NAME=Express Auth API
FRONTEND_URL=http://localhost:3000
```

### Resend Setup

1. Sign up at [Resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Configure your domain in Resend (optional)
4. Add the API key to your environment variables

## API Endpoints

### 1. User Registration (Modified)

**POST** `/api/auth/register`

Now automatically generates an email verification token and sends a verification email.

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account."
}
```

### 2. Verify Email

**GET** `/api/auth/verify-email/:token`

Verifies the user's email address using the token sent via email.

**Response (Success):**

```json
{
  "success": true,
  "message": "Email verified successfully. Your account is now active."
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "Invalid or expired email verification token"
}
```

### 3. Resend Verification Email

**POST** `/api/auth/resend-verification`

Sends a new verification email to the user.

```json
{
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Verification email sent successfully. Please check your inbox."
}
```

### 4. Check Email Verification Status

**GET** `/api/auth/email-status`

Returns the current email verification status for the authenticated user.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "isEmailVerified": true,
    "email": "john@example.com"
  }
}
```

## Middleware

### Email Verification Middleware

Use these middleware functions to protect routes that require verified emails:

#### `requireEmailVerification`

Blocks access if the user's email is not verified.

```javascript
import { requireEmailVerification } from '../middleware/index.js';

// Protect a route
router.get('/protected', protect, requireEmailVerification, controller);
```

#### `emailVerificationRequired(options)`

Configurable middleware with options:

```javascript
import { emailVerificationRequired } from '../middleware/index.js';

// Skip verification for admins
router.get(
  '/admin-route',
  protect,
  emailVerificationRequired({
    skipForAdmins: true,
  }),
  controller,
);

// Custom error message
router.get(
  '/premium',
  protect,
  emailVerificationRequired({
    customMessage: 'Please verify your email to access premium features',
  }),
  controller,
);
```

#### `optionalEmailVerification`

Adds verification status to request without blocking:

```javascript
import { optionalEmailVerification } from '../middleware/index.js';

router.get('/dashboard', protect, optionalEmailVerification, (req, res) => {
  if (req.isEmailVerified) {
    // Show full dashboard
  } else {
    // Show limited dashboard with verification prompt
  }
});
```

## Email Templates

The system includes beautiful HTML email templates:

### Verification Email

- Professional design with your app branding
- Clear call-to-action button
- Fallback link for accessibility
- 24-hour expiration notice

### Welcome Email

- Sent automatically after email verification
- Welcomes the user to the platform
- Lists available features

## User Model Changes

The User model now includes email verification fields:

```javascript
{
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
}
```

## Error Messages

New error messages for email verification:

- `EMAIL_NOT_VERIFIED`: "Please verify your email address before accessing this resource"
- `EMAIL_VERIFICATION_TOKEN_INVALID`: "Invalid or expired email verification token"
- `EMAIL_VERIFICATION_TOKEN_EXPIRED`: "Email verification token has expired. Please request a new one."
- `EMAIL_ALREADY_VERIFIED`: "Email address is already verified"
- `EMAIL_SEND_FAILED`: "Failed to send email. Please try again later."
- `EMAIL_VERIFICATION_REQUIRED`: "Email verification is required to complete this action"

## Frontend Integration

### Registration Flow

1. User submits registration form
2. Show success message: "Registration successful! Please check your email to verify your account."
3. Redirect to a "check your email" page
4. Provide option to resend verification email

### Email Verification Flow

1. User clicks verification link in email
2. Frontend calls `/api/auth/verify-email/:token`
3. Show success message and redirect to login
4. Optionally auto-login the user

### Dashboard Integration

```javascript
// Check verification status
const checkEmailStatus = async () => {
  const response = await fetch('/api/auth/email-status', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();

  if (!data.data.isEmailVerified) {
    showEmailVerificationBanner();
  }
};

// Resend verification
const resendVerification = async email => {
  const response = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (response.ok) {
    showSuccessMessage('Verification email sent!');
  }
};
```

## Testing

The implementation includes comprehensive tests:

- **Unit tests** for email verification controller
- **Integration tests** for email verification routes
- **Mocked email service** for testing without sending real emails

Run email verification tests:

```bash
npm test -- --testPathPattern="email_verification"
```

## Security Considerations

- ✅ **Token expiration**: Verification tokens expire after 24 hours
- ✅ **Secure token generation**: Uses crypto.randomBytes(32)
- ✅ **Rate limiting**: Applied to email sending endpoints
- ✅ **Input validation**: Email addresses are validated
- ✅ **Error handling**: Graceful handling of email service failures

## Troubleshooting

### Common Issues

1. **Email not received**
   - Check spam folder
   - Verify Resend domain configuration
   - Check API key validity

2. **Token expired**
   - Use resend verification endpoint
   - Tokens are valid for 24 hours

3. **Email service errors**
   - Check Resend API status
   - Verify environment variables
   - Check application logs

### Debug Mode

Enable detailed logging by setting `LOG_LEVEL=debug` in your environment.

## Production Deployment

1. **Configure Resend domain**: Set up SPF, DKIM, and DMARC records
2. **Set production URLs**: Update `FRONTEND_URL` for production
3. **Monitor email delivery**: Use Resend dashboard for analytics
4. **Set up alerts**: Monitor failed email deliveries

## Future Enhancements

Potential improvements for future versions:

- Email template customization
- Multiple email providers support
- Email verification reminders
- Bulk email operations
- Email analytics and tracking
