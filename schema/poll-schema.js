const mongoose = require('mongoose')

const pollSchema = mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        require: true
    },
    endTime: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('poll', pollSchema)