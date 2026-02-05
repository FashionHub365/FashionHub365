const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const paymentMethodSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    name: {
        type: String
    },
    type: {
        type: String // cod|card|momo|zalopay...
    },
    config: mongoose.Schema.Types.Mixed,
    enabled: {
        type: Boolean,
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
