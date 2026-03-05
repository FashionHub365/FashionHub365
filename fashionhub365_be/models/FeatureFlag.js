const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const featureFlagSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    key: {
        type: String,
        unique: true,
        required: true
    },
    description: {
        type: String
    },
    enabled: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
