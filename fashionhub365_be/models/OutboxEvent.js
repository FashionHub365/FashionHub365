const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const outboxEventSchema = new mongoose.Schema(
    {
        uuid: {
            type: String,
            default: uuidv4,
            unique: true,
            required: true,
        },
        aggregate_type: {
            type: String,
            required: true,
        },
        aggregate_id: {
            type: String,
            required: true,
        },
        event_type: {
            type: String,
            required: true,
        },
        payload: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        status: {
            type: String,
            enum: ['PENDING', 'PROCESSING', 'DONE', 'FAILED'],
            default: 'PENDING',
        },
        retry_count: {
            type: Number,
            default: 0,
            min: 0,
        },
        max_retry: {
            type: Number,
            default: 10,
            min: 1,
        },
        next_retry_at: {
            type: Date,
            default: Date.now,
        },
        locked_at: Date,
        processed_at: Date,
        last_error: String,
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

outboxEventSchema.index({ status: 1, next_retry_at: 1 });
outboxEventSchema.index({ aggregate_type: 1, aggregate_id: 1, event_type: 1 });

module.exports = mongoose.model('OutboxEvent', outboxEventSchema);
