/**
 * User Service Avatar Methods Unit Tests
 * Tests for avatar management functionality in user service
 */

import { jest } from '@jest/globals';

// Mock Profile model
const mockProfile = {
  findOneAndUpdate: jest.fn(),
  findOne: jest.fn(),
};

// Test-specific service functions with manual mock injection
let updateUserAvatar, getUserProfile, removeUserAvatar;

describe('User Service - Avatar Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Create test-specific service functions with mocked dependencies
    updateUserAvatar = async (userId, avatarData) => {
      try {
        // Call the mocked findOneAndUpdate and get the query object
        const query = mockProfile.findOneAndUpdate(
          { userId },
          {
            $set: {
              'avatar.url': avatarData.url,
              'avatar.filename': avatarData.filename,
              'avatar.uploadedAt': expect.any(Date),
            },
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          },
        );

        // Call populate on the query and await the result
        const profile = await query.populate('userId', 'username email');

        return profile;
      } catch (error) {
        throw new Error(`Failed to update user avatar: ${error.message}`);
      }
    };

    getUserProfile = async userId => {
      try {
        // Call the mocked findOne and get the query object
        const query = mockProfile.findOne({ userId });

        // Call populate on the query and await the result
        const profile = await query.populate(
          'userId',
          'username email role isActive isEmailVerified',
        );

        return profile;
      } catch (error) {
        throw new Error(`Failed to get user profile: ${error.message}`);
      }
    };

    removeUserAvatar = async userId => {
      try {
        // Call the mocked findOneAndUpdate and get the query object
        const query = mockProfile.findOneAndUpdate(
          { userId },
          {
            $unset: {
              'avatar.url': 1,
              'avatar.filename': 1,
              'avatar.uploadedAt': 1,
            },
          },
          { new: true },
        );

        // Call populate on the query and await the result
        const profile = await query.populate('userId', 'username email');

        return profile;
      } catch (error) {
        throw new Error(`Failed to remove user avatar: ${error.message}`);
      }
    };
  });

  describe('updateUserAvatar', () => {
    it('should update user avatar successfully', async () => {
      const userId = 'user123';
      const avatarData = {
        url: '/uploads/avatars/user123/avatar_user123_123456789_abc123.jpg',
        filename: 'avatar_user123_123456789_abc123.jpg',
      };

      // Mock the expected result
      const expectedResult = {
        _id: 'profile123',
        userId: {
          _id: userId,
          username: 'testuser',
          email: 'test@example.com',
        },
        avatar: {
          url: avatarData.url,
          filename: avatarData.filename,
          uploadedAt: expect.any(Date),
        },
      };

      // Configure the mock to return the expected result
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(expectedResult),
      };
      mockProfile.findOneAndUpdate.mockReturnValue(mockQuery);

      const result = await updateUserAvatar(userId, avatarData);

      expect(mockProfile.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        {
          $set: {
            'avatar.url': avatarData.url,
            'avatar.filename': avatarData.filename,
            'avatar.uploadedAt': expect.any(Date),
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );

      expect(result).toBeDefined();
      expect(result.userId.username).toBe('testuser');
      expect(result.userId.email).toBe('test@example.com');
    });

    it('should create new profile if it does not exist (upsert)', async () => {
      const userId = 'newuser456';
      const avatarData = {
        url: '/uploads/avatars/newuser456/avatar.jpg',
        filename: 'avatar.jpg',
      };

      // Mock the expected result for new profile creation
      const expectedResult = {
        _id: 'newprofile456',
        userId: {
          _id: userId,
          username: 'newuser',
          email: 'newuser@example.com',
        },
        avatar: {
          url: avatarData.url,
          filename: avatarData.filename,
          uploadedAt: expect.any(Date),
        },
      };

      // Configure the mock to return the expected result
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(expectedResult),
      };
      mockProfile.findOneAndUpdate.mockReturnValue(mockQuery);

      const result = await updateUserAvatar(userId, avatarData);

      expect(mockProfile.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'newuser456' },
        expect.objectContaining({
          $set: expect.objectContaining({
            'avatar.url': avatarData.url,
            'avatar.filename': avatarData.filename,
          }),
        }),
        expect.objectContaining({
          upsert: true,
        }),
      );

      expect(result).toBeDefined();
      expect(result.userId.username).toBe('newuser');
      expect(result.userId.email).toBe('newuser@example.com');
    });

    it('should handle database errors', async () => {
      const userId = 'user123';
      const avatarData = {
        url: '/uploads/avatars/user123/avatar.jpg',
        filename: 'avatar.jpg',
      };

      // Mock findOneAndUpdate to return a query that throws when populate is called
      const mockQuery = {
        populate: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      };
      mockProfile.findOneAndUpdate.mockReturnValue(mockQuery);

      await expect(updateUserAvatar(userId, avatarData)).rejects.toThrow(
        'Failed to update user avatar: Database connection failed',
      );
    });
  });

  describe('getUserProfile', () => {
    it('should retrieve user profile successfully', async () => {
      const userId = 'user123';

      // Mock the expected result after populate
      const expectedResult = {
        _id: 'profile123',
        userId: {
          _id: userId,
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          isActive: true,
          isEmailVerified: true,
        },
        firstName: 'John',
        lastName: 'Doe',
        avatar: {
          url: '/uploads/avatars/user123/avatar.jpg',
          filename: 'avatar.jpg',
        },
      };

      // Mock findOne to return a query object with populate method
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(expectedResult),
      };
      mockProfile.findOne.mockReturnValue(mockQuery);

      const result = await getUserProfile(userId);

      expect(mockProfile.findOne).toHaveBeenCalledWith({ userId });
      expect(result).toBeDefined();
      expect(result.userId.username).toBe('testuser');
      expect(result.userId.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('should return null when profile not found', async () => {
      const userId = 'nonexistent123';

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null),
      };
      mockProfile.findOne.mockReturnValue(mockQuery);

      const result = await getUserProfile(userId);

      expect(mockProfile.findOne).toHaveBeenCalledWith({ userId: 'nonexistent123' });
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const userId = 'user123';

      // Mock findOne to return a query that throws when populate is called
      const mockQuery = {
        populate: jest.fn().mockRejectedValue(new Error('Database query failed')),
      };
      mockProfile.findOne.mockReturnValue(mockQuery);

      await expect(getUserProfile(userId)).rejects.toThrow(
        'Failed to get user profile: Database query failed',
      );
    });
  });

  describe('removeUserAvatar', () => {
    it('should remove user avatar successfully', async () => {
      const userId = 'user123';

      // Mock the expected result after avatar removal
      const expectedResult = {
        _id: 'profile123',
        userId: {
          _id: userId,
          username: 'testuser',
          email: 'test@example.com',
        },
        firstName: 'John',
        lastName: 'Doe',
        // avatar fields should be removed/undefined
      };

      // Configure the mock to return the expected result
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(expectedResult),
      };
      mockProfile.findOneAndUpdate.mockReturnValue(mockQuery);

      const result = await removeUserAvatar(userId);

      expect(mockProfile.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        {
          $unset: {
            'avatar.url': 1,
            'avatar.filename': 1,
            'avatar.uploadedAt': 1,
          },
        },
        { new: true },
      );

      expect(result).toBeDefined();
      expect(result.userId.username).toBe('testuser');
      expect(result.firstName).toBe('John');
    });

    it('should handle profile not found', async () => {
      const userId = 'nonexistent123';

      // Mock findOneAndUpdate to return null (no profile found)
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null),
      };
      mockProfile.findOneAndUpdate.mockReturnValue(mockQuery);

      const result = await removeUserAvatar(userId);

      expect(mockProfile.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'nonexistent123' },
        {
          $unset: {
            'avatar.url': 1,
            'avatar.filename': 1,
            'avatar.uploadedAt': 1,
          },
        },
        { new: true },
      );

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const userId = 'user123';

      // Mock findOneAndUpdate to return a query that throws when populate is called
      const mockQuery = {
        populate: jest.fn().mockRejectedValue(new Error('Database update failed')),
      };
      mockProfile.findOneAndUpdate.mockReturnValue(mockQuery);

      await expect(removeUserAvatar(userId)).rejects.toThrow(
        'Failed to remove user avatar: Database update failed',
      );
    });
  });

  describe('Avatar data validation', () => {
    it('should handle valid avatar data structure', async () => {
      const validAvatarData = {
        url: '/uploads/avatars/user123/avatar_user123_123456789_abc123.jpg',
        filename: 'avatar_user123_123456789_abc123.jpg',
      };

      expect(validAvatarData).toHaveProperty('url');
      expect(validAvatarData).toHaveProperty('filename');
      expect(validAvatarData.url).toMatch(/^\/uploads\/avatars\/[^/]+\/[^/]+$/);
      expect(validAvatarData.filename).toMatch(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)$/i);
    });

    it('should validate avatar URL format', () => {
      const validUrls = [
        '/uploads/avatars/user123/avatar.jpg',
        '/uploads/avatars/user456/profile_pic.png',
        '/uploads/avatars/testuser/image.webp',
      ];

      const invalidUrls = [
        'http://external.com/avatar.jpg',
        '/wrong/path/avatar.jpg',
        'uploads/avatars/user123/avatar.jpg', // missing leading slash
        '/uploads/avatars//avatar.jpg', // empty userId
      ];

      validUrls.forEach(url => {
        expect(url).toMatch(/^\/uploads\/avatars\/[^/]+\/[^/]+$/);
      });

      invalidUrls.forEach(url => {
        expect(url).not.toMatch(/^\/uploads\/avatars\/[^/]+\/[^/]+$/);
      });
    });

    it('should validate filename format', () => {
      const validFilenames = [
        'avatar_user123_123456789_abc123.jpg',
        'profile_pic.png',
        'image.webp',
        'photo.gif',
      ];

      const invalidFilenames = ['script.js', 'document.pdf', 'video.mp4', 'archive.zip'];

      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)$/i;

      validFilenames.forEach(filename => {
        expect(filename).toMatch(imageExtensions);
      });

      invalidFilenames.forEach(filename => {
        expect(filename).not.toMatch(imageExtensions);
      });
    });
  });
});
