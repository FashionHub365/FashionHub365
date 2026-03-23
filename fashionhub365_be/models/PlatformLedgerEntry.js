const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const platformLedgerEntrySchema = new mongoose.Schema(
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
        },
        settlement_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Settlement',
        },
        payment_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment',
        },
        store_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
        },
        seller_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        entry_type: {
            type: String,
            enum: ['FEE_RECOGNIZED', 'FEE_REVERSED', 'MANUAL_ADJUSTMENT'],
            required: true,
        },
        direction: {
            type: String,
            enum: ['CREDIT', 'DEBIT'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'VND',
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

platformLedgerEntrySchema.index({ order_id: 1, entry_type: 1 }, { unique: true });
platformLedgerEntrySchema.index({ entry_type: 1, created_at: -1 });
platformLedgerEntrySchema.index({ created_at: -1 });

module.exports = mongoose.model('PlatformLedgerEntry', platformLedgerEntrySchema);
