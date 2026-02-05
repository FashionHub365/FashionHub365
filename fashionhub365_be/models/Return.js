const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const returnSchema = new mongoose.Schema({
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
    order_item_id: {
        type: String // refers to embedded order item _id
    },
    reason: {
        type: String
    },
    status: {
        type: String
    },
    requested_at: {
        type: Date,
        default: Date.now
    },
    received_at: {
        type: Date
    },
    resolved_at: {
        type: Date
    }
});

module.exports = mongoose.model('Return', returnSchema);
