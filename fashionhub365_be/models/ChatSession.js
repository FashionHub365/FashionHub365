const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const chatSessionSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    store_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    closed_at: {
        type: Date
    }
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
