const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const shippingLabelSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShippingProvider',
        required: true
    },
    label_url: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ShippingLabel', shippingLabelSchema);
