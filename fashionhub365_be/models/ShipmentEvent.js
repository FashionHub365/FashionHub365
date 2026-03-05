const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const shipmentEventSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    shipment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
        required: true
    },
    status: {
        type: String
    },
    location: {
        type: String
    },
    note: {
        type: String
    },
    occurred_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ShipmentEvent', shipmentEventSchema);
