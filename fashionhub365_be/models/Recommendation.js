const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const recommendationSchema = new mongoose.Schema({
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
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    score: {
        type: Number
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
