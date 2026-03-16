const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    scope: {
        type: String,
        enum: ['GLOBAL', 'STORE'],
        default: 'GLOBAL',
        required: true
    },
    permission_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }],
    is_system: {
        type: Boolean,
        default: false // System roles cannot be deleted
    },
    deleted_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

roleSchema.pre('save', function () {
    if (this.slug) {
        this.slug = this.slug.trim().toLowerCase();
    }
});

module.exports = mongoose.model('Role', roleSchema);
