const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const refundSchema = new mongoose.Schema({
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
    payment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    amount: {
        type: Number,
        required: true
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
    processed_at: {
        type: Date
    }
});

module.exports = mongoose.model('Refund', refundSchema);
