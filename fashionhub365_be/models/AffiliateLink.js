const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const affiliateLinkSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    program_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AffiliateProgram',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    code: {
        type: String,
        unique: true,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AffiliateLink', affiliateLinkSchema);
