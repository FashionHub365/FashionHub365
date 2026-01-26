const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const pricingRuleSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    type: {
        type: String, // bulk|subscription|tier
        required: true
    },
    min_quantity: {
        type: Number,
        default: 1
    },
    price: {
        type: Number,
        required: true
    },
    cycle: {
        type: String
    },
    starts_at: {
        type: Date
    },
    ends_at: {
        type: Date
    }
});

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
