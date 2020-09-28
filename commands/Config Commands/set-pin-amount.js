const Discord = require('discord.js')
const mongo = require('../../mongo')
const reply = require('../../message-reply')
const commandBase = require('../command-base')
const botScript = require('../../bot')
const messagePin = require('../../message-pin')

const guildConfigSchema = require('../../schema/guild-config')

module.exports = {
    commands: 'pin-amount',
    description: `Changes the amount of users needed to react to pin a message. Default is set to 5.`,
    category: 'admin',
    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '[amount]',
    permissions: 'ADMINISTRATOR',
    callback: async (message, arguments) => {
        await mongo().then(async mongoose => {
            try {
                const guildId = message.guild.id

                let n = 0

                n = parseInt(arguments[0])

                if (n == NaN) {
                    reply.replyExclaim('Please provide a number!')
                    return
                }

                await guildConfigSchema.findOneAndUpdate({
                    _id: guildId
                }, {
                    _id: guildId,
                    requiredPinAmount: n
                }, {
                    upsert: true,
                    useFindAndModify: false
                })

                messagePin.updateCache(guildId, n)
                reply.replyExclaim(message, `Pin requirements have now been set to **${n}** users!`)
            } finally {
                mongoose.connection.close()
            }
        })
    }
}