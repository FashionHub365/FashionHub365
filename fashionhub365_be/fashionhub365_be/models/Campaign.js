const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const campaignSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    name: {
        type: String
    },
    description: {
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
    banner_url: {
        type: String
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        promoPrice: Number
    }]
});

module.exports = mongoose.model('Campaign', campaignSchema);
