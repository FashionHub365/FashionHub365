const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const affiliateCommissionSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    link_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AffiliateLink',
        required: true
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    paid_at: {
        type: Date
    }
});

module.exports = mongoose.model('AffiliateCommission', affiliateCommissionSchema);
