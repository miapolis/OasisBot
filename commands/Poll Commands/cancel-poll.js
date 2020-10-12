const Discord = require('discord.js')
const pollSystem = require('../../Polls/polling-system')

module.exports = {
    commands: 'cancelpoll',
    category: 'polls',
    description: 'Cancels given poll. Use **[%%]viewpolls** to see the IDs of running polls.',
    permissions: 'ADMINISTRATOR',
    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '[poll ID]',
    callback: async (message, args) => {
        const givenID = args[0]

        pollSystem.cancelPoll(message, givenID)
    }
}