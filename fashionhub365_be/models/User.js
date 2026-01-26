const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true
  },
  username: {
    type: String
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password_hash: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'BANNED', 'PENDING'],
    default: 'PENDING'
  },
  role_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  profile: {
    fullName: String,
    dob: Date,
    phone: String,
    gender: String,
    avatarUrl: String,
    bio: String
  },
  addresses: [{
    recipientName: String,
    phone: String,
    street: String,
    city: String,
    province: String,
    country: String,
    postalCode: String,
    isDefault: {
      type: Boolean,
      default: false
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('User', userSchema);
