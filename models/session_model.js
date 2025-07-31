import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Token management
    accessToken: {
      type: String,
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    accessTokenExpiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    refreshTokenExpiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    // Device and security info
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },

    deviceInfo: {
      browser: String,
      os: String,
      device: String,
    },
    location: {
      country: String,
      city: String,
      region: String,
    },
    // Session status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: -1,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Instance methods
sessionSchema.methods.updateActivity = function () {
  this.lastActivity = new Date();
  return this.save();
};

sessionSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

sessionSchema.methods.refreshTokens = function (
  newAccessToken,
  newRefreshToken,
  accessTokenExpiresAt,
  refreshTokenExpiresAt
) {
  this.accessToken = newAccessToken;
  this.refreshToken = newRefreshToken;
  this.accessTokenExpiresAt = accessTokenExpiresAt;
  this.refreshTokenExpiresAt = refreshTokenExpiresAt;
  this.lastActivity = new Date();
  return this.save();
};

sessionSchema.methods.isAccessTokenExpired = function () {
  return new Date() >= this.accessTokenExpiresAt;
};

sessionSchema.methods.isRefreshTokenExpired = function () {
  return new Date() >= this.refreshTokenExpiresAt;
};

sessionSchema.methods.isValidForRefresh = function () {
  return this.isActive && !this.isRefreshTokenExpired();
};

// Static methods
sessionSchema.statics.findActiveByUserId = function (userId) {
  return this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ lastActivity: -1 });
};

sessionSchema.statics.findByRefreshToken = function (refreshToken) {
  return this.findOne({
    refreshToken,
    isActive: true,
    refreshTokenExpiresAt: { $gt: new Date() },
  }).populate('userId');
};

sessionSchema.statics.findByAccessToken = function (accessToken) {
  return this.findOne({
    accessToken,
    isActive: true,
    accessTokenExpiresAt: { $gt: new Date() },
  }).populate('userId');
};

sessionSchema.statics.deactivateAllForUser = function (userId) {
  return this.updateMany({ userId }, { isActive: false });
};

sessionSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;
