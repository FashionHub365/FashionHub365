const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const voucherUsageSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    voucher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voucher',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    used_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('VoucherUsage', voucherUsageSchema);
