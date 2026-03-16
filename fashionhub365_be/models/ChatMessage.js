const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const chatMessageSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    chat_session_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatSession',
        required: false // Optional for simple bot interactions
    },
    sender_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for AI responses
    },
    role: {
        type: String,
        enum: ['user', 'model'],
        default: 'user'
    },
    message: {
        type: String,
        required: true
    },
    attachments: [mongoose.Schema.Types.Mixed],
    sent_at: {
        type: Date,
        default: Date.now
    },
    is_read: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);