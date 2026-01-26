const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const searchHistorySchema = new mongoose.Schema({
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
    query: {
        type: String
    },
    results_count: {
        type: Number
    },
    searched_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
