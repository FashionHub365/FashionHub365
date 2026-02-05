const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const shippingProviderSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    name: {
        type: String
    },
    website: {
        type: String
    },
    contact_phone: {
        type: String
    },
    contact_email: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ShippingProvider', shippingProviderSchema);
