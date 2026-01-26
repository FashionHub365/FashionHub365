const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const payoutSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    store_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    requested_at: {
        type: Date,
        default: Date.now
    },
    processed_at: {
        type: Date
    }
});

module.exports = mongoose.model('Payout', payoutSchema);
