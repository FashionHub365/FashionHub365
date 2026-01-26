const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const storeUpgradeRequestSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    store_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    requested_level: {
        type: String,
        enum: ['trusted', 'premium'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    note: {
        type: String
    },
    reviewed_at: {
        type: Date
    },
    reviewed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: false
    }
});

module.exports = mongoose.model('StoreUpgradeRequest', storeUpgradeRequestSchema);
