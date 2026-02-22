const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true // Ensure codes are standardized e.g., USER.CREATE
    },
    module: {
        type: String,
        required: true,
        trim: true,
        uppercase: true // e.g., USER, PRODUCT, ORDER
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

permissionSchema.pre('save', function (next) {
    if (this.code) {
        this.code = this.code.trim().toUpperCase();
    }
    if (this.module) {
        this.module = this.module.trim().toUpperCase();
    }
    next();
});

module.exports = mongoose.model('Permission', permissionSchema);
