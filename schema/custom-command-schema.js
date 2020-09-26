const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true
}

const discordMessage = {
    message: String,
    embed: {
        title: {
            type: String,
            default: ''
        },
        description: {
            type: String,
            default: ''
        },
        hexColor: {
            type: String,
            default: ''
        },
        thumbnailURL: {
            type: String,
            default: ''
        },
        fields: [{
            name: String,
            value: String,
            inline: Boolean,
            default: ''
        }],
        footer: {
            text: String,
            iconURL: String,
            default: ''
        },
        default: ''
    }
}

const customCommandSchema = mongoose.Schema({
    commandName: reqString,
    defaultResponse: discordMessage,
    amountOfResponses: {
        type: Number,
        required: true
    },
    responses: [{
        discordMessage
    }],
    customCommandType: { //1: Default, 2: Random, 3: Embed, 4: Random Embed
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('customCommand', customCommandSchema)