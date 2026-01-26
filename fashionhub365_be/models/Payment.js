const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const paymentSchema = new mongoose.Schema({
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
    method: {
        type: String
    },
    provider: {
        type: String
    },
    transaction_id: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paid_at: {
        type: Date
    },
    raw_payload: {
        type: String
    },
    transactions: [{
        providerTxnId: String,
        amount: Number,
        status: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: false
    }
});

module.exports = mongoose.model('Payment', paymentSchema);
