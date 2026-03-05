const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const fileSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    owner_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    url: {
        type: String
    },
    mime_type: {
        type: String
    },
    size: {
        type: Number
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('File', fileSchema);
