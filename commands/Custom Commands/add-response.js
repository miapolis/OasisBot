const Discord = require('discord.js')
const customCommands = require('../../custom-commands')

const reply = require('../../message-reply')

module.exports = {
    commands: 'addr',
    category: 'commands',
    description: "Adds a new '[person] be like:' response to given random command.",
    permissions: 'ADMINISTRATOR',
    minArgs: 2,
    expectedArgs: '[command name] [content]',
    callback: async (message, args) => {
        const commandName = args[0].toLowerCase()

        const found = await customCommands.getCustomCommand(commandName)

        if (!found) {
            reply.replyExclaim(message, "Hmm... that command doesn't seem to exist!")
            return
        }

        if (found.customCommandType !== 2) {
            console.log(found)
            reply.replyExclaim(message, 'Command must be a random command.')
            return
        }

        let newResponses = found.responses
        let formattedContent = ''

        for (var i = 1; i < args.length; ++i) {
            formattedContent += args[i] + ' '
        }

        const properName = found.commandName.charAt(0).toUpperCase() + found.commandName.slice(1)
        let newResponse = { message: `${properName} be like:\n\n${formattedContent.trimEnd()}`, embed: null }
        newResponses.push(newResponse)

        await customCommands.editCustomCommand(found.commandName, found.commandName, { message: '', embed: null }, found.amountOfResponses + 1, newResponses, found.channelIds) //(originalName, name, defaultResponse, amountOfResponses, responses, channelIds)

        reply.replyExclaim(message, 'Done!')
    }
}