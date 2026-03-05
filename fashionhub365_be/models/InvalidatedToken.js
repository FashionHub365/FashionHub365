const mongoose = require('mongoose');

const invalidatedTokenSchema = new mongoose.Schema({
    token_hash: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    expires_at: {
        type: Date,
        required: true,
    },
}, {
    timestamps: { createdAt: 'created_at' },
});

invalidatedTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('InvalidatedToken', invalidatedTokenSchema);
