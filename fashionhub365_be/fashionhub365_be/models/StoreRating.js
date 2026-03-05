const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const storeRatingSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    store_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stars: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comment: {
        type: String
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

// Unique index for store_id and user_id if one rating per user
storeRatingSchema.index({ store_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('StoreRating', storeRatingSchema);
