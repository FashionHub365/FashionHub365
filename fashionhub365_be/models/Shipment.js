const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const shipmentSchema = new mongoose.Schema({
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
    tracking_number: {
        type: String
    },
    status: {
        type: String
    },
    shipped_at: {
        type: Date
    },
    delivered_at: {
        type: Date
    },
    last_event_at: {
        type: Date
    }
});

module.exports = mongoose.model('Shipment', shipmentSchema);
