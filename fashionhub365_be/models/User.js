const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password_hash: {
    type: String,
    required: true,
    select: false // Do not return by default
  },
  is_email_verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING'],
    default: 'PENDING'
  },
  global_role_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  profile: {
    full_name: String,
    phone: String,
    avatar_url: String,
    gender: String,
    dob: Date,
    bio: String
  },
  last_login_at: Date,
  login_attempts: {
    type: Number,
    default: 0
  },
  lock_until: Date,
  password_changed_at: Date
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes

userSchema.index({ username: 1 });

// Methods
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password_hash);
};

userSchema.methods.isPasswordChangedAfter = function (JWTTimestamp) {
  if (this.password_changed_at) {
    const changedTimestamp = parseInt(this.password_changed_at.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Statics
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

module.exports = mongoose.model('User', userSchema);
