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
    payment_method_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentMethod'
    },
    store_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    method: {
        type: String
    },
    provider: {
        type: String
    },
    transaction_id: {
        type: String,
        unique: true,
        sparse: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'VND'
    },
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'],
        default: 'PENDING'
    },
    bank_info: {
        bank_name: String,
        account_name: String,
        account_number: String,
        bin: String
    },
    transfer_content: {
        type: String
    },
    paid_at: {
        type: Date
    },
    failed_at: {
        type: Date
    },
    cancelled_at: {
        type: Date
    },
    raw_payload: {
        type: String
    },
    expires_at: {
        type: Date
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

paymentSchema.index({ order_id: 1, status: 1 });
paymentSchema.index({ store_id: 1, status: 1 });
paymentSchema.index({ status: 1, expires_at: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
