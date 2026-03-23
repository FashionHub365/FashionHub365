const mongoose = require('mongoose');

const userVoucherSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    voucher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voucher',
        required: true
    },
    status: {
        type: String,
        enum: ['claimed', 'used', 'expired'],
        default: 'claimed'
    },
    claimed_at: {
        type: Date,
        default: Date.now
    },
    used_at: {
        type: Date
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }
});

// Compound index to prevent duplicate claims
userVoucherSchema.index({ user_id: 1, voucher_id: 1 }, { unique: true });

module.exports = mongoose.model('UserVoucher', userVoucherSchema);
