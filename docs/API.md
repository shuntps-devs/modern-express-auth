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
  "email": "john@example.com",
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

### Profile Routes (`/api/profile`)

🔐 **Authentication Required**: All profile endpoints require valid authentication and email verification.

#### GET `/api/profile`

Get user profile with avatar and bio information.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "profile": {
      "bio": "Software developer passionate about clean code and innovation.",
      "avatar": "http://localhost:3000/uploads/avatars/507f1f77bcf86cd799439011/avatar-1641234567890.jpg",
      "user": {
        "id": "507f1f77bcf86cd799439011",
        "username": "johndoe",
        "email": "john@example.com",
        "role": "user",
        "isActive": true,
        "isEmailVerified": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastLogin": "2024-01-15T10:30:00.000Z"
      }
    }
  }
}
```

#### PATCH `/api/profile`

Update user profile bio.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "bio": "Updated bio text - passionate full-stack developer with 5+ years experience."
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "profile": {
      "bio": "Updated bio text - passionate full-stack developer with 5+ years experience.",
      "avatar": "http://localhost:3000/uploads/avatars/507f1f77bcf86cd799439011/avatar-1641234567890.jpg",
      "user": {
        "id": "507f1f77bcf86cd799439011",
        "username": "johndoe",
        "email": "john@example.com"
      }
    }
  }
}
```

**Validation Rules:**

- `bio`: Optional string, max 500 characters, automatically trimmed
- Empty bio is allowed and will be stored as empty string

#### PATCH `/api/profile/avatar`

Upload or update user avatar image.

**Headers:**

- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Request Body (Form Data):**

- `avatar`: Image file (JPEG, PNG, WebP, GIF)

**File Requirements:**

- **Max Size**: 5MB
- **Formats**: JPEG, PNG, WebP, GIF
- **MIME Types**: image/jpeg, image/png, image/webp, image/gif

**Response (200):**

```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar": {
      "url": "http://localhost:3000/uploads/avatars/507f1f77bcf86cd799439011/avatar-1641234567890.jpg",
      "filename": "avatar-1641234567890.jpg",
      "size": 245760,
      "uploadedAt": "2024-01-15T15:30:00.000Z"
    }
  }
}
```

**Error (400) - File Too Large:**

```json
{
  "success": false,
  "message": "File size exceeds the maximum limit of 5MB",
  "error": "FILE_TOO_LARGE"
}
```

**Error (400) - Invalid File Type:**

```json
{
  "success": false,
  "message": "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed",
  "error": "INVALID_FILE_TYPE"
}
```

#### DELETE `/api/profile/avatar`

Remove user avatar image.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Avatar removed successfully",
  "data": {
    "removed": true,
    "previousAvatar": "avatar-1641234567890.jpg"
  }
}
```

**Error (404) - No Avatar:**

```json
{
  "success": false,
  "message": "No avatar found to remove",
  "error": "AVATAR_NOT_FOUND"
}
```

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

### Session Management Routes (`/api/sessions`)

🔐 **Authentication Required**: All session endpoints require valid authentication.

#### GET `/api/sessions/active`

Retrieve all active sessions for the authenticated user with enriched device and location information.

**Response (200):**

```json
{
  "success": true,
  "message": "Active sessions retrieved successfully",
  "data": {
    "sessions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "deviceInfo": {
          "browser": "Chrome",
          "os": "Windows",
          "device": "Desktop"
        },
        "location": {
          "country": "US",
          "city": "New York",
          "region": "NY"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "lastActivity": "2024-01-15T14:45:00.000Z",
        "expiresAt": "2024-01-22T10:30:00.000Z",
        "securityLevel": "medium",
        "isCurrent": true
      }
    ],
    "total": 3
  }
}
```

#### GET `/api/sessions/:sessionId`

Get detailed information about a specific session.

**Parameters:**

- `sessionId` (string): The session ID to retrieve

**Response (200):**

```json
{
  "success": true,
  "message": "Session details retrieved successfully",
  "data": {
    "session": {
      "_id": "507f1f77bcf86cd799439011",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "deviceInfo": {
        "browser": "Chrome",
        "os": "Windows",
        "device": "Desktop"
      },
      "location": {
        "country": "US",
        "city": "New York",
        "region": "NY"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastActivity": "2024-01-15T14:45:00.000Z",
      "expiresAt": "2024-01-22T10:30:00.000Z",
      "securityLevel": "medium",
      "isCurrent": true
    }
  }
}
```

#### GET `/api/sessions/stats/devices`

Get device statistics for user sessions.

**Response (200):**

```json
{
  "success": true,
  "message": "Device statistics retrieved successfully",
  "data": {
    "deviceStats": {
      "browsers": {
        "Chrome": 5,
        "Firefox": 2,
        "Safari": 1
      },
      "operatingSystems": {
        "Windows": 4,
        "macOS": 2,
        "Android": 2
      },
      "deviceTypes": {
        "Desktop": 6,
        "Mobile": 2
      }
    },
    "totalSessions": 8
  }
}
```

#### GET `/api/sessions/stats/locations`

Get location statistics for user sessions.

**Response (200):**

```json
{
  "success": true,
  "message": "Location statistics retrieved successfully",
  "data": {
    "locationStats": {
      "countries": {
        "US": 5,
        "CA": 2,
        "UK": 1
      },
      "cities": {
        "New York": 3,
        "Toronto": 2,
        "London": 1,
        "Los Angeles": 2
      },
      "regions": {
        "NY": 3,
        "ON": 2,
        "England": 1,
        "CA": 2
      }
    },
    "totalSessions": 8
  }
}
```

#### GET `/api/sessions/security-overview`

Get security overview of user sessions.

**Response (200):**

```json
{
  "success": true,
  "message": "Security overview retrieved successfully",
  "data": {
    "securityOverview": {
      "totalActiveSessions": 3,
      "suspiciousActivity": {
        "multipleLocations": true,
        "unusualDevices": false,
        "recentLoginAttempts": 2
      },
      "securityLevels": {
        "high": 1,
        "medium": 2,
        "low": 0
      },
      "recommendations": [
        "Consider terminating sessions from unfamiliar locations",
        "Enable two-factor authentication for enhanced security"
      ]
    }
  }
}
```

#### DELETE `/api/sessions/:sessionId`

Terminate a specific session.

**Parameters:**

- `sessionId` (string): The session ID to terminate

**Response (200):**

```json
{
  "success": true,
  "message": "Session terminated successfully",
  "data": {
    "terminatedSession": {
      "_id": "507f1f77bcf86cd799439011",
      "terminatedAt": "2024-01-15T15:00:00.000Z"
    }
  }
}
```

**Error (400):**

```json
{
  "success": false,
  "message": "Cannot terminate current session"
}
```

#### DELETE `/api/sessions/terminate-others`

Terminate all other sessions except the current one.

**Response (200):**

```json
{
  "success": true,
  "message": "Other sessions terminated successfully",
  "data": {
    "terminatedSessions": 2
  }
}
```

## 🔒 Security Features

- JWT tokens with secure storage
- Password hashing with bcrypt
- Account lockout after failed attempts
- IP-based session validation
- Device and location tracking
- Session security level assessment
- CORS protection
- Helmet security headers
- Rate limiting
- Input validation with Zod
