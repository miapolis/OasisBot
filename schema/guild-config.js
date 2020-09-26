const mongoose = require('mongoose')

const configSchema = mongoose.Schema({
    _id: {
        type: String,
        required: true
    },

    prefix: {
        type: String,
        required: true
    },

    requiredPinAmount: {
        type: Number,
        required: true,
        default: 5
    }
})

module.exports = mongoose.model('guild-configs', configSchema)