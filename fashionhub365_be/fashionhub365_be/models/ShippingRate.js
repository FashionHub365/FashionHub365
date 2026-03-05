const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const shippingRateSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShippingProvider',
        required: true
    },
    zone_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShippingZone',
        required: true
    },
    min_weight: {
        type: Number
    },
    max_weight: {
        type: Number
    },
    base_fee: {
        type: Number
    },
    per_kg_fee: {
        type: Number
    },
    eta_days: {
        type: Number
    }
});

module.exports = mongoose.model('ShippingRate', shippingRateSchema);
