import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Session } from '../models/index.js';
import { env } from '../config/index.js';
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  COOKIE_CONFIG,
  COOKIE_PATHS,
} from '../constants/index.js';
import {
  setAuthCookies,
  calculateTokenExpirations,
  createEnrichedSessionData,
} from '../utils/index.js';

class AuthService {
  // Convert JWT time string to milliseconds
  parseJwtTime(timeString) {
    const units = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(ERROR_MESSAGES.INVALID_TIME_FORMAT);
    }

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  // Generate Access JWT token (short-lived)
  generateAccessToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN, // 15 minutes
    });
  }

  // Generate Refresh JWT token (long-lived)
  generateRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN, // 7 days
    });
  }

  // Generate random token for additional security
  generateRandomToken() {
    return crypto.randomBytes(40).toString('hex');
  }

  // Verify Access JWT token
  verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
  }

  // Verify Refresh JWT token
  verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  }

  // Send token response
  async sendTokenResponse(user, statusCode, res, req) {
    // Create access and refresh tokens
    const accessToken = this.generateAccessToken({ id: user._id });
    const refreshToken = this.generateRefreshToken({ id: user._id });

    // Calculate expiration times using utility
    const accessTokenExpiryMs = this.parseJwtTime(env.JWT_EXPIRES_IN);
    const refreshTokenExpiryMs = this.parseJwtTime(env.JWT_REFRESH_EXPIRES_IN);
    const { accessTokenExpiresAt, refreshTokenExpiresAt } = calculateTokenExpirations(
      accessTokenExpiryMs,
      refreshTokenExpiryMs,
    );
    const sessionExpiryMs = this.parseJwtTime(env.SESSION_EXPIRES_IN);
    const sessionExpiresAt = new Date(Date.now() + sessionExpiryMs);

    // Get enriched client info with device detection and location
    const enrichedSessionData = createEnrichedSessionData(req);

    // Create session with tokens and enriched data
    const session = await Session.create({
      userId: user._id,
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      ipAddress: enrichedSessionData.ipAddress,
      userAgent: enrichedSessionData.userAgent,
      deviceInfo: enrichedSessionData.deviceInfo,
      location: enrichedSessionData.location,
      isActive: true,
      expiresAt: sessionExpiresAt,
    });

    // Set authentication cookies using utility
    setAuthCookies(
      res,
      {
        accessToken,
        refreshToken,
        sessionId: session._id.toString(),
      },
      { accessTokenExpiresAt, refreshTokenExpiresAt },
    );

    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
    };

    res.status(statusCode).json({
      success: true,
      user: userResponse,
    });
  }

  // Refresh tokens using refresh token
  async refreshTokens(refreshToken, _req) {
    try {
      // Find session by refresh token
      const session = await Session.findByRefreshToken(refreshToken);
      if (!session) {
        throw new Error(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
      }

      // Verify session is valid for refresh
      const isValid = session.isValidForRefresh();
      if (!isValid) {
        throw new Error(ERROR_MESSAGES.SESSION_EXPIRED_OR_INACTIVE);
      }

      // Verify the refresh token
      const decoded = this.verifyRefreshToken(refreshToken);

      // Handle populated userId field - get the actual ID
      const sessionUserId = session.userId._id
        ? session.userId._id.toString()
        : session.userId.toString();

      if (!decoded || decoded.id !== sessionUserId) {
        throw new Error(ERROR_MESSAGES.TOKEN_VALIDATION_FAILED);
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken({ id: session.userId });
      const newRefreshToken = this.generateRefreshToken({ id: session.userId });

      // Calculate new expiration times using centralized config
      const accessTokenExpiryMs = this.parseJwtTime(env.JWT_EXPIRES_IN);
      const refreshTokenExpiryMs = this.parseJwtTime(env.JWT_REFRESH_EXPIRES_IN);
      const accessTokenExpiresAt = new Date(Date.now() + accessTokenExpiryMs);
      const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenExpiryMs);

      // Update session with new tokens
      await session.refreshTokens(
        newAccessToken,
        newRefreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: accessTokenExpiryMs / 1000,
        session,
      };
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.TOKEN_REFRESH_OPERATION_FAILED} ${error.message}`);
    }
  }

  // Validate access token and return session
  async validateAccessToken(accessToken) {
    try {
      // Verify JWT token
      this.verifyAccessToken(accessToken);

      // Find session by access token
      const session = await Session.findByAccessToken(accessToken);
      if (!session || !session.isActive) {
        throw new Error(ERROR_MESSAGES.INVALID_OR_INACTIVE_SESSION);
      }

      // Check if access token is expired
      if (session.isAccessTokenExpired()) {
        throw new Error(ERROR_MESSAGES.ACCESS_TOKEN_EXPIRED);
      }

      // Update last activity
      await session.updateActivity();

      return { session, user: session.userId };
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.TOKEN_VALIDATION_FAILED}: ${error.message}`);
    }
  }

  // Clear authentication cookies
  clearAuthCookies(res) {
    res.cookie('accessToken', COOKIE_CONFIG.CLEAR_VALUE, {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.cookie('refreshToken', COOKIE_CONFIG.CLEAR_VALUE, {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      path: COOKIE_PATHS.REFRESH_TOKEN,
    });

    res.cookie('sessionId', COOKIE_CONFIG.CLEAR_VALUE, {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
  }

  // Format user sessions for response
  formatUserSessions(sessions, currentSessionId) {
    return sessions
      .filter(session => session.isActive && session.expiresAt > new Date())
      .map(session => ({
        _id: session._id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        isCurrent: session._id.toString() === currentSessionId,
      }));
  }

  // ===== ENHANCED METHODS (B, C, D) =====

  // B) Handle complete token refresh process with response
  async handleTokenRefresh(refreshToken, req, res) {
    try {
      // Refresh tokens using existing method
      const result = await this.refreshTokens(refreshToken, req);

      // Calculate expiration dates for cookies
      const accessTokenExpiryMs = this.parseJwtTime(env.JWT_EXPIRES_IN);
      const refreshTokenExpiryMs = this.parseJwtTime(env.JWT_REFRESH_EXPIRES_IN);
      const { accessTokenExpiresAt, refreshTokenExpiresAt } = calculateTokenExpirations(
        accessTokenExpiryMs,
        refreshTokenExpiryMs,
      );

      // Set authentication cookies
      setAuthCookies(
        res,
        {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          sessionId: result.session._id.toString(),
        },
        { accessTokenExpiresAt, refreshTokenExpiresAt },
      );

      // Send standardized response
      res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.TOKEN_REFRESH_SUCCESS,
      });
      return result;
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.TOKEN_REFRESH_HANDLING_FAILED} ${error.message}`);
    }
  }

  // C) Enhanced token validation with specific error types
  async validateAndGetSession(token, tokenType = 'refresh') {
    try {
      let session;

      if (tokenType === 'refresh') {
        session = await Session.findByRefreshToken(token);
        if (!session) {
          throw new Error(ERROR_MESSAGES.SESSION_NOT_FOUND_FOR_REFRESH);
        }
        if (!session.isValidForRefresh()) {
          throw new Error(ERROR_MESSAGES.REFRESH_TOKEN_EXPIRED_OR_INVALID);
        }
      } else if (tokenType === 'access') {
        session = await Session.findByAccessToken(token);
        if (!session) {
          throw new Error(ERROR_MESSAGES.SESSION_NOT_FOUND_FOR_ACCESS);
        }
        if (!session.isValidForAccess()) {
          throw new Error(ERROR_MESSAGES.ACCESS_TOKEN_EXPIRED_OR_INVALID);
        }
      } else {
        throw new Error(ERROR_MESSAGES.INVALID_TOKEN_TYPE);
      }

      if (!session.isActive) {
        throw new Error(ERROR_MESSAGES.SESSION_IS_INACTIVE);
      }

      return session;
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.TOKEN_VALIDATION_FAILED}: ${error.message}`);
    }
  }

  // Login method with enhanced security tracking
  async login(email, password) {
    try {
      // Find user with password
      const { User } = await import('../models/index.js');
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new Error(ERROR_MESSAGES.ACCOUNT_LOCKED);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error(ERROR_MESSAGES.ACCOUNT_INACTIVE);
      }

      // Verify password
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        // Increment login attempts
        await user.incLoginAttempts();
        throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Update last login timestamp
      user.lastLogin = new Date();
      await user.save();

      return user;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Get user security status (login attempts, lock status, last login)
  async getUserSecurityStatus(userId) {
    try {
      const { User } = await import('../models/index.js');
      const user = await User.findById(userId).select('loginAttempts lockUntil lastLogin isActive');

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      return {
        loginAttempts: user.loginAttempts || 0,
        isLocked: user.isLocked,
        lockUntil: user.lockUntil,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        securityLevel: this.calculateSecurityLevel(user),
      };
    } catch (error) {
      throw new Error(`Failed to get security status: ${error.message}`);
    }
  }

  // Calculate security level based on user activity
  calculateSecurityLevel(user) {
    let level = 'good';

    if (user.loginAttempts > 0) {
      level = 'warning';
    }

    if (user.loginAttempts >= 3) {
      level = 'danger';
    }

    if (user.isLocked) {
      level = 'locked';
    }

    return level;
  }

  // Reset user login attempts (admin function)
  async resetUserLoginAttempts(userId) {
    try {
      const { User } = await import('../models/index.js');
      const user = await User.findById(userId);

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      await user.resetLoginAttempts();

      return {
        success: true,
        message: SUCCESS_MESSAGES.LOGIN_ATTEMPTS_RESET_SUCCESS,
        userId: user._id,
      };
    } catch (error) {
      throw new Error(`Failed to reset login attempts: ${error.message}`);
    }
  }

  // D) Session cleanup and management methods
  async cleanupExpiredSessions(userId = null) {
    try {
      const query = {
        $or: [
          { expiresAt: { $lt: new Date() } },
          { refreshTokenExpiresAt: { $lt: new Date() } },
          { isActive: false },
        ],
      };

      if (userId) {
        query.userId = userId;
      }

      const result = await Session.deleteMany(query);
      return {
        deletedCount: result.deletedCount,
        message: SUCCESS_MESSAGES.SESSIONS_CLEANUP_SUCCESS(result.deletedCount),
      };
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.SESSION_CLEANUP_OPERATION_FAILED} ${error.message}`);
    }
  }

  async revokeAllUserSessions(userId, exceptSessionId = null) {
    try {
      const query = { userId, isActive: true };

      if (exceptSessionId) {
        query._id = { $ne: exceptSessionId };
      }

      const result = await Session.updateMany(query, {
        $set: { isActive: false, deactivatedAt: new Date() },
      });

      return {
        modifiedCount: result.modifiedCount,
        message: SUCCESS_MESSAGES.SESSIONS_REVOKE_SUCCESS(result.modifiedCount),
      };
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.SESSION_REVOCATION_OPERATION_FAILED} ${error.message}`);
    }
  }

  async getActiveSessionsCount(userId) {
    try {
      const count = await Session.countDocuments({
        userId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      return count;
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.ACTIVE_SESSIONS_COUNT_FAILED} ${error.message}`);
    }
  }

  async getUserActiveSessions(userId) {
    try {
      const sessions = await Session.find({
        userId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      }).sort({ lastActivity: -1 });

      return sessions.map(session => ({
        _id: session._id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        deviceInfo: session.deviceInfo || {
          browser: 'Unknown',
          os: 'Unknown',
          device: 'Unknown',
        },
        location: session.location || {
          country: 'Unknown',
          city: 'Unknown',
          region: 'Unknown',
        },
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
      }));
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.USER_SESSIONS_RETRIEVAL_FAILED} ${error.message}`);
    }
  }

  // Get session by ID for specific user
  async getSessionById(sessionId, userId) {
    try {
      const session = await Session.findOne({
        _id: sessionId,
        userId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });
      return session;
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.SESSION_NOT_FOUND} ${error.message}`);
    }
  }

  // Terminate a specific session
  async terminateSession(sessionId, userId) {
    try {
      const result = await Session.findOneAndUpdate(
        {
          _id: sessionId,
          userId,
          isActive: true,
        },
        {
          isActive: false,
          lastActivity: new Date(),
        },
        { new: true },
      );
      return result;
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.SESSION_TERMINATION_FAILED} ${error.message}`);
    }
  }

  // Terminate all other sessions except current one
  async terminateOtherSessions(userId, currentSessionId) {
    try {
      const result = await Session.updateMany(
        {
          userId,
          _id: { $ne: currentSessionId },
          isActive: true,
        },
        {
          isActive: false,
          lastActivity: new Date(),
        },
      );
      return result.modifiedCount;
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.SESSION_TERMINATION_FAILED} ${error.message}`);
    }
  }

  async revokeSpecificSession(sessionId, userId) {
    try {
      const result = await Session.findOneAndUpdate(
        { _id: sessionId, userId, isActive: true },
        { $set: { isActive: false, deactivatedAt: new Date() } },
        { new: true },
      );

      if (!result) {
        throw new Error(ERROR_MESSAGES.SESSION_NOT_FOUND_OR_INACTIVE);
      }

      return {
        success: true,
        message: SUCCESS_MESSAGES.SESSION_REVOKED_SUCCESS,
        sessionId: result._id,
      };
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.SESSION_REVOCATION_OPERATION_FAILED} ${error.message}`);
    }
  }
}

export default new AuthService();
