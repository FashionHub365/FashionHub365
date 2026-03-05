const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const shippingZoneSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    name: {
        type: String
    },
    description: {
        type: String
    }
});

module.exports = mongoose.model('ShippingZone', shippingZoneSchema);
