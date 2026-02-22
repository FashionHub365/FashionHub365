const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    token_hash: {
        type: String,
        required: true,
        index: true,
    },
    expires_at: {
        type: Date,
        required: true,
    },
    used_at: {
        type: Date,
        default: null,
    },
}, {
    timestamps: { createdAt: 'created_at' },
});

// TTL: auto-remove after expiry + 1 day grace
passwordResetTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
