const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const storeFollowerSchema = new mongoose.Schema({
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
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    followed_at: {
        type: Date,
        default: Date.now
    }
});

// Unique index for store_id and user_id
storeFollowerSchema.index({ store_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('StoreFollower', storeFollowerSchema);
