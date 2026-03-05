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
        required: true
    },
    sender_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String
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
