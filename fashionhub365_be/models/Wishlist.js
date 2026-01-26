const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const wishlistSchema = new mongoose.Schema({
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
    name: {
        type: String
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: false
    }
});

module.exports = mongoose.model('Wishlist', wishlistSchema);
