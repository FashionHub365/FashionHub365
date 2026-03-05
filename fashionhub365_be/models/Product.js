const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const productSchema = new mongoose.Schema({
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
    brand_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand'
    },
    primary_category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    category_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    collection_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection'
    }],
    tag_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true,
        required: true
    },
    short_description: {
        type: String
    },
    description: {
        type: String
    },
    base_price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'inactive', 'blocked'],
        default: 'draft'
    },
    media: [{
        mediaType: String,
        url: String,
        isPrimary: Boolean,
        sortOrder: Number
    }],
    variants: [{
        sku: String,
        variantName: String,
        price: Number,
        stock: Number,
        barcode: String,
        attributes: mongoose.Schema.Types.Mixed,
        condition: String,
        defects: String,
        measurements: mongoose.Schema.Types.Mixed
    }]
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('Product', productSchema);
