const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const permissionSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    code: {
        type: String,
        unique: true,
        required: true
    },
    description: {
        type: String
    },
    group_name: {
        type: String
    }
});

module.exports = mongoose.model('Permission', permissionSchema);
