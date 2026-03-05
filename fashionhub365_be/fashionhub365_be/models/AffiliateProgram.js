const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const affiliateProgramSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    name: {
        type: String
    },
    cookie_days: {
        type: Number,
        default: 30
    },
    commission_type: {
        type: String // percent|fixed
    },
    commission_value: {
        type: Number
    },
    status: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AffiliateProgram', affiliateProgramSchema);
