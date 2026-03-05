const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userAddressSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    full_name: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    line1: {
        type: String,
        required: true,
        trim: true,
    },
    line2: {
        type: String,
        trim: true,
        default: '',
    },
    ward: {
        type: String,
        trim: true,
        default: '',
    },
    district: {
        type: String,
        required: true,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    state: {
        type: String,
        trim: true,
        default: '',
    },
    postal_code: {
        type: String,
        trim: true,
        default: '',
    },
    country: {
        type: String,
        trim: true,
        default: 'Vietnam',
    },
    note: {
        type: String,
        trim: true,
        default: '',
    },
    is_default: {
        type: Boolean,
        default: false,
    },
    deleted_at: {
        type: Date,
        default: null,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

userAddressSchema.index({ user_id: 1, deleted_at: 1, is_default: 1 });

module.exports = mongoose.model('UserAddress', userAddressSchema);
