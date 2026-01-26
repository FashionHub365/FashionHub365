const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const inventorySchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variant_id: {
        type: String // refers to embedded variant _id
    },
    location: {
        type: String
    },
    quantity: {
        type: Number,
        default: 0
    },
    used_quantity: {
        type: Number,
        default: 0
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// unique (product_id, variant_id, location) in Mongo index
inventorySchema.index({ product_id: 1, variant_id: 1, location: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
