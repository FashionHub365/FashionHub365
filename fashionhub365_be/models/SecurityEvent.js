const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const securityEventSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    event_type: {
        type: String
    },
    details: {
        type: String
    },
    occurred_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SecurityEvent', securityEventSchema);
