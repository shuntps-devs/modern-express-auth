import { User, Session } from '../models/index.js';

class UserService {
  // Find user by email
  async findUserByEmail(email, includePassword = false) {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return await query;
  }

  // Find user by username
  async findUserByUsername(username) {
    return await User.findOne({ username });
  }

  // Find user by email or username
  async findUserByEmailOrUsername(email, username) {
    return await User.findOne({
      $or: [{ email }, { username }],
    });
  }

  // Find user by ID
  async findUserById(id, includePassword = false) {
    const query = User.findById(id);
    if (includePassword) {
      query.select('+password');
    }
    return await query;
  }

  // Find user by session
  async findUserBySession(sessionId) {
    const session = await Session.findOne({
      _id: sessionId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).populate('userId');

    return session ? session.userId : null;
  }

  // Create new user
  async createUser(userData) {
    return await User.create(userData);
  }

  // Update user
  async updateUser(userId, updateData) {
    return await User.findByIdAndUpdate(
      userId,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      },
    );
  }

  // Update user password
  async updateUserPassword(userId, newPassword) {
    const user = await User.findById(userId);
    user.password = newPassword;
    return await user.save();
  }

  // Deactivate user (soft delete)
  async deactivateUser(userId) {
    return await User.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      },
    );
  }

  // Get all users with pagination and filters
  async getAllUsers(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (filters.role) {
      filter.role = filters.role;
    }
    if (filters.isActive !== undefined) {
      filter.isActive = filters.isActive === 'true';
    }
    if (filters.search) {
      filter.$or = [
        { username: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password -sessions')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get user statistics
  async getUserStatistics() {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
    const unverifiedUsers = await User.countDocuments({ isEmailVerified: false });

    // Users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      verifiedUsers,
      unverifiedUsers,
      usersByRole,
      recentRegistrations,
    };
  }

  // Format user response (remove sensitive data)
  formatUserResponse(user, includeDetails = false) {
    const baseResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar || null,
      createdAt: user.createdAt,
    };

    if (includeDetails) {
      return {
        ...baseResponse,
        lastLogin: user.lastLogin,
        updatedAt: user.updatedAt,
      };
    }

    return baseResponse;
  }

  // Format profile response (include bio and avatar)
  formatProfileResponse(profile) {
    if (!profile) return null;

    return {
      _id: profile._id,
      userId: profile.userId,
      bio: profile.bio || null,
      avatar: profile.avatar || null,
      preferences: profile.preferences || {},
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  // Check if user exists
  async userExists(email, username) {
    const user = await this.findUserByEmailOrUsername(email, username);
    return !!user;
  }

  // Validate user credentials
  async validateCredentials(email, password) {
    const user = await this.findUserByEmail(email, true);

    if (!user || !user.isActive || user.isLocked) {
      return null;
    }

    const isValidPassword = await user.comparePassword(password);
    return isValidPassword ? user : null;
  }

  // Email verification methods
  async findUserByEmailVerificationToken(token) {
    return await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });
  }

  async verifyUserEmail(userId) {
    return await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          isEmailVerified: true,
        },
        $unset: {
          emailVerificationToken: 1,
          emailVerificationExpires: 1,
        },
      },
      { new: true },
    );
  }

  async updateEmailVerificationToken(userId, tokenData) {
    return await User.findByIdAndUpdate(
      userId,
      {
        emailVerificationToken: tokenData.emailVerificationToken,
        emailVerificationExpires: tokenData.emailVerificationExpires,
      },
      { new: true },
    );
  }

  // Avatar management methods
  async updateUserAvatar(userId, avatarData) {
    try {
      const { Profile } = await import('../models/index.js');

      // Update or create profile with new avatar
      const profile = await Profile.findOneAndUpdate(
        { userId },
        {
          $set: {
            'avatar.url': avatarData.url,
            'avatar.filename': avatarData.filename,
            'avatar.uploadedAt': new Date(),
          },
        },
        {
          new: true,
          upsert: true, // Create profile if it doesn't exist
          runValidators: true,
        },
      ).populate('userId', 'username email avatar');

      return profile;
    } catch (error) {
      throw new Error(`Failed to update user avatar: ${error.message}`);
    }
  }

  async getUserProfile(userId) {
    try {
      const { Profile } = await import('../models/index.js');

      const profile = await Profile.findOne({ userId }).populate(
        'userId',
        'username email role isActive isEmailVerified avatar',
      );

      return profile;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  async removeUserAvatar(userId) {
    try {
      const { Profile } = await import('../models/index.js');

      const profile = await Profile.findOneAndUpdate(
        { userId },
        {
          $unset: {
            'avatar.url': 1,
            'avatar.filename': 1,
            'avatar.uploadedAt': 1,
          },
        },
        { new: true },
      ).populate('userId', 'username email avatar');

      return profile;
    } catch (error) {
      throw new Error(`Failed to remove user avatar: ${error.message}`);
    }
  }
}

export default new UserService();
