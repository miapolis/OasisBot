const mongoose = require('mongoose')

const incognitoPollSchema = mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        require: true
    },
    setReactions: [],
    endTime: {
        type: Number,
        required: true
    },
    reactions: [],
    participants: []
})

module.exports = mongoose.model('incognitoPoll', incognitoPollSchema)