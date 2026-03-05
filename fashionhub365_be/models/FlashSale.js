const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const flashSaleSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    name: {
        type: String
    },
    starts_at: {
        type: Date
    },
    ends_at: {
        type: Date
    },
    status: {
        type: String
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        stock: Number,
        salePrice: Number,
        perUserLimit: Number
    }]
});

module.exports = mongoose.model('FlashSale', flashSaleSchema);
