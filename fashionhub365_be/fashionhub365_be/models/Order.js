const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    store_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    shipping_address: mongoose.Schema.Types.Mixed,
    status: {
        type: String,
        enum: ['created', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'created'
    },
    payment_status: {
        type: String,
        enum: ['unpaid', 'paid', 'failed', 'refunded'],
        default: 'unpaid'
    },
    shipping_fee: {
        type: Number,
        default: 0
    },
    discount_total: {
        type: Number,
        default: 0
    },
    total_amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'VND'
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        variantId: String,
        qty: Number,
        price: Number,
        discount: Number,
        subtotal: Number,
        snapshot: mongoose.Schema.Types.Mixed
    }],
    status_history: [{
        oldStatus: String,
        newStatus: String,
        changedBy: String,
        changedAt: {
            type: Date,
            default: Date.now
        },
        note: String
    }],
    invoice: {
        invoiceNumber: String,
        taxNumber: String,
        companyName: String,
        companyAddress: String,
        totalTax: Number,
        createdAt: Date
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('Order', orderSchema);
