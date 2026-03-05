const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const systemSettingSchema = new mongoose.Schema({
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
    value: {
        type: String
    },
    scope: {
        type: String
    }
}, {
    timestamps: {
        createdAt: false,
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
