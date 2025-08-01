import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    avatar: {
      url: String,
      publicId: String,
      uploadedAt: Date,
    },
    bio: {
      type: String,
      trim: true,
    },
    preferences: {
      twoFactorAuth: {
        isEnabled: { type: Boolean, default: false },
        secret: String,
        backupCodes: [String],
        enabledAt: Date,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Timestamp index (for sorting/querying by creation date)
profileSchema.index({ createdAt: -1 });

// Instance methods
profileSchema.methods.updateAvatar = function (avatarData) {
  this.avatar = {
    ...avatarData,
    uploadedAt: new Date(),
  };
  return this.save();
};

profileSchema.methods.removeAvatar = function () {
  this.avatar = undefined;
  return this.save();
};

profileSchema.methods.updatePreferences = function (newPreferences) {
  this.preferences = { ...this.preferences.toObject(), ...newPreferences };
  return this.save();
};

profileSchema.methods.enable2FA = function (secret, backupCodes) {
  this.preferences.twoFactorAuth = {
    isEnabled: true,
    secret,
    backupCodes,
    enabledAt: new Date(),
  };
  return this.save();
};

profileSchema.methods.disable2FA = function () {
  this.preferences.twoFactorAuth = {
    isEnabled: false,
    secret: undefined,
    backupCodes: [],
    enabledAt: undefined,
  };
  return this.save();
};

// Static methods
profileSchema.statics.findByUserId = function (userId) {
  return this.findOne({ userId }).populate('userId', 'username email');
};

profileSchema.statics.updateByUserId = function (userId, updateData) {
  return this.findOneAndUpdate({ userId }, updateData, {
    new: true,
    upsert: true,
    runValidators: true,
  });
};

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
