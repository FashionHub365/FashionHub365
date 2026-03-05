const mongoose = require('mongoose');

const productReviewSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        maxLength: 100
    },
    content: {
        type: String,
        maxLength: 1000
    },
    verified_purchase: {
        type: Boolean,
        default: false
    },
    reviewer_info: {
        height: String,
        weight: String,
        body_type: String,
        size_purchased: String,
        name: String
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('ProductReview', productReviewSchema);
