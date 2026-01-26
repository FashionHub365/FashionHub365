const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const searchSuggestionSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    term: {
        type: String
    },
    popularity: {
        type: Number,
        default: 0
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SearchSuggestion', searchSuggestionSchema);
