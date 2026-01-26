const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const brandSchema = new mongoose.Schema({
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
    logo_url: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Brand', brandSchema);
