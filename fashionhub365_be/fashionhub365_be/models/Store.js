const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const storeSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    owner_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true,
        required: true
    },
    description: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'closed'],
        default: 'active'
    },
    is_draft: {
        type: Boolean,
        default: true
    },
    level: {
        value: {
            type: String,
            enum: ['basic', 'trusted', 'premium'],
            default: 'basic'
        },
        upgradedAt: Date
    },
    information: {
        type: { type: String },
        name: String,
        addressesText: String,
        taxCode: String,
        emails: [String],
        isDraft: Boolean,
        createdAt: Date,
        updatedAt: Date
    },
    identification: {
        type: { type: String },
        fullName: String,
        imgFront: String,
        imgBack: String,
        isDraft: Boolean,
        createdAt: Date,
        updatedAt: Date
    },
    addresses: [mongoose.Schema.Types.Mixed],
    bank_accounts: [mongoose.Schema.Types.Mixed],
    documents: [{
        docType: String,
        fileUrl: String,
        verified: Boolean,
        verifiedAt: Date
    }],
    rating_summary: {
        avgStars: { type: Number, default: 0 },
        totalRatings: { type: Number, default: 0 }
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('Store', storeSchema);
