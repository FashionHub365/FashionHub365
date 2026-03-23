const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const settlementSchema = new mongoose.Schema(
    {
        uuid: {
            type: String,
            default: uuidv4,
            unique: true,
            required: true,
        },
        order_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            unique: true,
        },
        payment_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment',
        },
        store_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        seller_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        currency: {
            type: String,
            default: 'VND',
        },
        gross_amount: {
            type: Number,
            default: 0,
        },
        shipping_amount: {
            type: Number,
            default: 0,
        },
        discount_amount: {
            type: Number,
            default: 0,
        },
        platform_fee_amount: {
            type: Number,
            default: 0,
        },
        payment_fee_amount: {
            type: Number,
            default: 0,
        },
        net_amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'available', 'cancelled', 'refunded'],
            default: 'pending',
        },
        released_to_wallet_at: {
            type: Date,
        },
        available_at: {
            type: Date,
        },
        notes: {
            type: String,
            default: '',
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

settlementSchema.index({ status: 1, created_at: -1 });
settlementSchema.index({ seller_user_id: 1, status: 1, created_at: -1 });
settlementSchema.index({ store_id: 1, status: 1, created_at: -1 });
settlementSchema.index({ created_at: -1 });

module.exports = mongoose.model('Settlement', settlementSchema);
