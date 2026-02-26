const mongoose = require('mongoose');

const storeMemberSchema = new mongoose.Schema({
    store_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    }],
    status: {
        type: String,
        enum: ['ACTIVE', 'INVITED', 'INACTIVE'],
        default: 'ACTIVE'
    },
    joined_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Ensure a user is added to a store only once
storeMemberSchema.index({ store_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('StoreMember', storeMemberSchema);
