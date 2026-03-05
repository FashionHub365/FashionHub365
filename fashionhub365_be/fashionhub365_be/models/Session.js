const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    refresh_token_hash: {
        type: String,
        required: true,
        index: true
    },
    user_agent: String,
    ip_address: String,
    device_info: String,
    is_revoked: {
        type: Boolean,
        default: false
    },
    revoked_at: Date,
    expires_at: {
        type: Date,
        required: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// TTL: auto-remove expired sessions after 7 days grace period
sessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('Session', sessionSchema);
