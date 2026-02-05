const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const voucherSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    code: {
        type: String,
        unique: true,
        required: true
    },
    description: {
        type: String
    },
    discount_type: {
        type: String, // percent|fixed
        required: true
    },
    discount_value: {
        type: Number,
        required: true
    },
    min_order_amount: {
        type: Number,
        default: 0
    },
    start_date: {
        type: Date
    },
    end_date: {
        type: Date
    },
    usage_limit: {
        type: Number,
        default: 1
    },
    used_count: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Voucher', voucherSchema);
