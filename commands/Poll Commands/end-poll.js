const Discord = require('discord.js')
const pollSystem = require('../../Polls/polling-system')

module.exports = {
    commands: 'endpoll',
    category: 'polls',
    description: 'Ends given poll early. Use **[prefix]viewpolls** to see the IDs of running polls.',
    permissions: 'ADMINISTRATOR',
    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '[poll ID]',
    callback: async (message, args) => {
        const givenID = args[0]

        pollSystem.endPollEarly(message, givenID)
    }
}