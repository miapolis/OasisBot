const Discord = require('discord.js')
const bot = require('../../bot')

const globalLogChannelId = '760157578750984263'

const reply = require('../../message-reply')

module.exports = {
    commands: 'sharelog',
    category: 'null',
    description: 'Shares one log message to sepcified channel.',
    permissions: 'ADMINISTRATOR',
    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '[log-message-id] [channel-id]',
    callback: async (message, args) => {
        const messageId = args[0]
        const channelId = args[1]

        const logChannel = bot.getClient().channels.cache.get(globalLogChannelId) //That should be good
        try {
            const fetchedLog = await logChannel.messages.fetch(messageId)
            const channel = await bot.getClient().channels.cache.get(channelId)

            channel.send(fetchedLog.embeds[0])
        } catch (error) {
            message.channel.send(`**${error.toString()}**`)
        }


    }
}