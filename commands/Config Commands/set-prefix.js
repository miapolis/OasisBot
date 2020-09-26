const Discord = require('discord.js')
const mongo = require('../../mongo')
const reply = require('../../message-reply')
const commandBase = require('../command-base')

const guildConfigSchema = require('../../schema/guild-config')

module.exports = {
    commands: 'prefix',
    description: 'Sets the prefix for this guild.',
    category: 'null',
    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '[new prefix]',
    callback: async (message, arguments) => {
        await mongo().then(async mongoose => {
            try {
                const guildId = message.guild.id
                const prefix = arguments[0]

                await guildConfigSchema.findOneAndUpdate({
                    _id: guildId
                }, {
                    _id: guildId,
                    prefix
                }, {
                    upsert: true,
                    useFindAndModify: false
                })

                await commandBase.refreshGuildPrefix(message)
                reply.replyExclaim(message, `Prefix has now been set to **${prefix}**`)
            } finally {
                mongoose.connection.close()
            }
        })
    }
}