const mongoose = require('mongoose');

const userPermissionOverrideSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    permission_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
        required: true,
        index: true,
    },
    effect: {
        type: String,
        enum: ['ALLOW', 'DENY'],
        default: 'ALLOW',
        required: true,
    },
    note: {
        type: String,
        trim: true,
        default: '',
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

userPermissionOverrideSchema.index({ user_id: 1, permission_id: 1 }, { unique: true });

module.exports = mongoose.model('UserPermissionOverride', userPermissionOverrideSchema);
