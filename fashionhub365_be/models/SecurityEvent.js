const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    event_type: {
        type: String,
        required: true,
        enum: [
            'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_LOCKED',
            'LOGOUT', 'REGISTER',
            'REFRESH_REUSE', 'TOKEN_REVOKED',
            'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS',
            'EMAIL_VERIFY_REQUEST', 'EMAIL_VERIFY_SUCCESS',
        ],
    },
    severity: {
        type: String,
        enum: ['INFO', 'WARNING', 'CRITICAL'],
        default: 'INFO'
    },
    ip_address: String,
    user_agent: String,
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: { createdAt: 'created_at' }
});

module.exports = mongoose.model('SecurityEvent', securityEventSchema);
