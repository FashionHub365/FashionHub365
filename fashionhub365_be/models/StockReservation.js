const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const stockReservationSchema = new mongoose.Schema(
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
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        store_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'CONFIRMED', 'RELEASED', 'EXPIRED'],
            default: 'ACTIVE',
        },
        reason: {
            type: String,
        },
        items: [
            {
                product_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                variant_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                },
                qty: {
                    type: Number,
                    required: true,
                    min: 1,
                },
            },
        ],
        expires_at: {
            type: Date,
            required: true,
        },
        confirmed_at: Date,
        released_at: Date,
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

stockReservationSchema.index({ order_id: 1, status: 1 });
stockReservationSchema.index({ status: 1, expires_at: 1 });

module.exports = mongoose.model('StockReservation', stockReservationSchema);
