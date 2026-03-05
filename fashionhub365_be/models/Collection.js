const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const collectionSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    banner_url: {
        type: String
    },
    status: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Collection', collectionSchema);
