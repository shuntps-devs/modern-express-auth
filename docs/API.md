# API Documentation

Complete documentation for the Express Authentication API endpoints.

## 🔗 Base URL

```
http://localhost:3000/api
```

## 🔐 Authentication

This API uses JWT (JSON Web Tokens) for authentication with dual-token system:

- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived (7 days) for token renewal

### Token Usage

**Header Authentication:**

```
Authorization: Bearer <access_token>
```

**Cookie Authentication:**
Tokens are automatically sent via secure HTTP-only cookies.

## 📋 Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "isEmailVerified": false
    }
  }
}
```

#### POST `/api/auth/login`

Authenticate user and receive tokens.

**Request Body:**

```json
{
  "emailOrUsername": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### POST `/api/auth/refresh`

Refresh access token using refresh token.

**Request:** Refresh token via cookie or header

**Response (200):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_access_token"
  }
}
```

#### POST `/api/auth/logout`

Logout user and invalidate tokens.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### POST `/api/auth/forgot-password`

Request password reset.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### POST `/api/auth/reset-password`

Reset password using reset token.

**Request Body:**

```json
{
  "resetToken": "reset_token_from_email",
  "newPassword": "NewSecurePassword123!"
}
```

#### POST `/api/auth/change-password`

Change password (authenticated users).

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "currentPassword": "CurrentPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

### User Routes (`/api/users`)

#### GET `/api/users/me`

Get current user profile.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "isEmailVerified": true,
      "lastLogin": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### PUT `/api/users/profile`

Update user profile.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

#### DELETE `/api/users/deactivate`

Deactivate user account.

**Headers:** `Authorization: Bearer <access_token>`

#### GET `/api/users/sessions`

Get user's active sessions.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session_id",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2024-01-15T10:30:00Z",
        "lastActivity": "2024-01-15T11:00:00Z"
      }
    ]
  }
}
```

#### DELETE `/api/users/sessions/:sessionId`

Revoke specific session.

**Headers:** `Authorization: Bearer <access_token>`

### Admin Routes (`/api/admin`)

**Note:** Requires `admin` role.

#### GET `/api/admin/users`

Get all users (admin only).

#### PUT `/api/admin/users/:userId/role`

Update user role.

**Request Body:**

```json
{
  "role": "admin"
}
```

## 🚨 Error Responses

### Standard Error Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "statusCode": 400
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `423` - Account Locked
- `429` - Too Many Requests
- `500` - Internal Server Error

## 🛡️ Rate Limiting

Different endpoints have different rate limits:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Password Reset**: 3 requests per hour
- **Profile Updates**: 10 requests per hour

## 🔒 Security Features

- JWT tokens with secure storage
- Password hashing with bcrypt
- Account lockout after failed attempts
- IP-based session validation
- CORS protection
- Helmet security headers
- Rate limiting
- Input validation with Zod
