# Avatar Upload System Documentation

## Overview

The Avatar Upload System provides secure file upload functionality for user profile pictures with comprehensive validation, automatic cleanup, and organized storage.

## Features

### 🔒 Security Features

- **File Type Validation**: Only image files allowed (JPEG, PNG, WebP, GIF, BMP, TIFF, SVG)
- **Size Limits**: Maximum 5MB per file
- **Filename Security**: Prevents path traversal attacks
- **Authentication Required**: All endpoints protected by JWT authentication
- **Email Verification**: Requires verified email address
- **User Isolation**: Each user has their own directory

### 🗂️ Storage Organization

- **Base Directory**: `uploads/avatars/`
- **User Directories**: `uploads/avatars/{userId}/`
- **Secure Filenames**: `avatar_{userId}_{timestamp}_{random}.{ext}`
- **Automatic Cleanup**: Old avatars deleted when new ones are uploaded

### 🚀 Performance Features

- **Single File Upload**: One avatar per request
- **Automatic Old File Cleanup**: Prevents storage bloat
- **Static File Serving**: Direct access via URL
- **Optimized File Handling**: Efficient Multer configuration

## API Endpoints

### Get User Profile

```http
GET /api/profile
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "profile": {
      "_id": "profile123",
      "userId": {
        "username": "johndoe",
        "email": "john@example.com"
      },
      "firstName": "John",
      "lastName": "Doe",
      "avatar": {
        "url": "/uploads/avatars/user123/avatar_user123_1640995200000_abc123.jpg",
        "filename": "avatar_user123_1640995200000_abc123.jpg",
        "uploadedAt": "2023-12-31T12:00:00.000Z"
      }
    }
  }
}
```

### Upload/Update Avatar

```http
PATCH /api/profile/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

avatar: [image file]
```

**Response:**

```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "profile": {
      "_id": "profile123",
      "userId": {
        "username": "johndoe",
        "email": "john@example.com"
      },
      "avatar": {
        "url": "/uploads/avatars/user123/avatar_user123_1640995200000_abc123.jpg",
        "filename": "avatar_user123_1640995200000_abc123.jpg",
        "uploadedAt": "2023-12-31T12:00:00.000Z"
      }
    },
    "avatar": {
      "url": "/uploads/avatars/user123/avatar_user123_1640995200000_abc123.jpg",
      "filename": "avatar_user123_1640995200000_abc123.jpg",
      "size": 1024000,
      "mimetype": "image/jpeg"
    }
  }
}
```

### Remove Avatar

```http
DELETE /api/profile/avatar
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "message": "Avatar removed successfully",
  "data": {
    "profile": {
      "_id": "profile123",
      "userId": {
        "username": "johndoe",
        "email": "john@example.com"
      }
    }
  }
}
```

### Update Profile (excluding avatar)

```http
PATCH /api/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Software Developer",
  "location": "New York",
  "website": "https://johndoe.com",
  "phoneNumber": "+1234567890"
}
```

## Error Responses

### File Validation Errors

```json
{
  "success": false,
  "message": "Invalid file type. Allowed types: image/jpeg, image/png, ..."
}
```

### Size Limit Errors

```json
{
  "success": false,
  "message": "File too large. Maximum size allowed is 5MB"
}
```

### Authentication Errors

```json
{
  "success": false,
  "message": "Access token required for authentication"
}
```

### No File Provided

```json
{
  "success": false,
  "message": "Avatar file is required"
}
```

## Usage Examples

### JavaScript/Fetch API

```javascript
// Upload avatar
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);

const response = await fetch('/api/profile/avatar', {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
console.log('Avatar uploaded:', result.data.avatar.url);
```

### cURL Examples

```bash
# Upload avatar
curl -X PATCH http://localhost:5000/api/profile/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@profile.jpg"

# Get profile
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Remove avatar
curl -X DELETE http://localhost:5000/api/profile/avatar \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### React Example

```jsx
import React, { useState } from 'react';

function AvatarUpload({ token, onUpload }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async event => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onUpload(result.data.avatar.url);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

## File Specifications

### Supported Formats

- **JPEG/JPG**: `.jpg`, `.jpeg`
- **PNG**: `.png`
- **WebP**: `.webp`
- **GIF**: `.gif`
- **BMP**: `.bmp`
- **TIFF**: `.tiff`
- **SVG**: `.svg`

### Size Limits

- **Maximum File Size**: 5MB (5,242,880 bytes)
- **Recommended Size**: 1MB or less for optimal performance
- **Dimensions**: No specific restrictions, but 512x512px recommended

### MIME Types

```javascript
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
];
```

## Architecture

### Components

1. **Multer Middleware** (`middleware/avatar_upload.js`)
   - File validation and storage
   - Security checks
   - Automatic cleanup

2. **Profile Controller** (`controllers/profile_controller.js`)
   - Request handling
   - Response formatting
   - Error management

3. **User Service** (`services/user_service.js`)
   - Database operations
   - Profile management
   - Avatar CRUD operations

4. **Profile Routes** (`routes/profile_routes.js`)
   - Route definitions
   - Middleware integration
   - Authentication protection

### Database Schema

```javascript
// Profile Model
{
  userId: ObjectId,
  avatar: {
    url: String,        // "/uploads/avatars/user123/filename.jpg"
    filename: String,   // "avatar_user123_1640995200000_abc123.jpg"
    uploadedAt: Date    // Upload timestamp
  },
  firstName: String,
  lastName: String,
  bio: String,
  location: String,
  website: String,
  phoneNumber: String
}
```

## Security Considerations

### File Validation

- **MIME Type Checking**: Server-side validation of file types
- **Extension Validation**: Double-check file extensions
- **Size Limits**: Prevent large file uploads
- **Filename Sanitization**: Remove dangerous characters

### Access Control

- **Authentication Required**: JWT token validation
- **Email Verification**: Verified accounts only
- **User Isolation**: Users can only access their own avatars
- **Path Traversal Prevention**: Secure filename generation

### Storage Security

- **Organized Structure**: User-specific directories
- **Secure Filenames**: Timestamp + random string
- **Automatic Cleanup**: Old files removed automatically
- **Static Serving**: Direct file access via Express

## Testing

### Unit Tests

- **Controller Tests**: 11 test cases covering all endpoints
- **Middleware Tests**: 19 test cases for file handling
- **Service Tests**: 12 test cases for database operations

### Test Coverage

```bash
# Run avatar-specific tests
npm test -- --testPathPattern="profile_controller|avatar_upload|user_service_avatar"

# Run all tests
npm test
```

### Manual Testing

```bash
# Test file upload
curl -X PATCH http://localhost:5000/api/profile/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@test-image.jpg"

# Verify file exists
ls uploads/avatars/YOUR_USER_ID/

# Test file access
curl http://localhost:5000/uploads/avatars/YOUR_USER_ID/filename.jpg
```

## Troubleshooting

### Common Issues

#### "No avatar file provided"

- Ensure the form field name is `avatar`
- Check Content-Type is `multipart/form-data`
- Verify file is selected before upload

#### "File too large"

- Check file size is under 5MB
- Compress image before upload
- Consider implementing client-side resizing

#### "Invalid file type"

- Ensure file is an image format
- Check MIME type is supported
- Verify file extension matches content

#### "Access token required"

- Include Authorization header
- Verify token is valid and not expired
- Check email verification status

### Debug Mode

Enable debug logging by setting environment variable:

```bash
DEBUG=avatar:* npm start
```

## Performance Optimization

### Recommendations

1. **Client-Side Resizing**: Resize images before upload
2. **Image Compression**: Use tools like Sharp for optimization
3. **CDN Integration**: Serve static files via CDN
4. **Caching**: Implement browser caching headers
5. **Background Processing**: Process images asynchronously

### Monitoring

- Monitor upload success rates
- Track file sizes and types
- Monitor storage usage
- Alert on unusual activity

## Future Enhancements

### Planned Features

- **Image Resizing**: Automatic thumbnail generation
- **Multiple Formats**: Support for additional image formats
- **Cloud Storage**: Integration with AWS S3 or similar
- **Image Processing**: Filters, cropping, rotation
- **Bulk Operations**: Multiple file uploads

### Integration Options

- **CDN Support**: CloudFront, CloudFlare
- **Cloud Storage**: AWS S3, Google Cloud Storage
- **Image Processing**: Sharp, ImageMagick
- **Monitoring**: CloudWatch, DataDog

## Support

For issues or questions regarding the Avatar Upload System:

1. Check this documentation
2. Review error messages carefully
3. Test with different file types and sizes
4. Verify authentication and permissions
5. Check server logs for detailed error information

---

_Last updated: January 2025_
_Version: 1.1.3_
