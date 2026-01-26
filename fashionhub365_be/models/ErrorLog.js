const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const errorLogSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    level: {
        type: String
    },
    source: {
        type: String
    },
    message: {
        type: String
    },
    stacktrace: {
        type: String
    },
    occurred_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ErrorLog', errorLogSchema);
