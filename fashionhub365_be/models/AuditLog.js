const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    target_collection: String,
    target_id: mongoose.Schema.Types.ObjectId,
    old_values: mongoose.Schema.Types.Mixed,
    new_values: mongoose.Schema.Types.Mixed,
    ip_address: String,
    user_agent: String
}, {
    timestamps: { createdAt: 'created_at' }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
