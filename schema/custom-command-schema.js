const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true
}

const customCommandSchema = mongoose.Schema({
    commandName: reqString,
    defaultResponse: reqString,
    amountOfResponses: {
        type: Number,
        required: true
    },
    responses: [{
        type: String
    }],
    customCommandType: { //1: Default 2: Random
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('customCommand', customCommandSchema)