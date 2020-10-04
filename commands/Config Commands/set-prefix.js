const Discord = require('discord.js')
const mongo = require('../../mongo')
const reply = require('../../message-reply')
const commandBase = require('../command-base')
const bot = require('../../bot')

const guildConfigSchema = require('../../schema/guild-config')

module.exports = {
    commands: 'prefix',
    description: 'Sets the prefix for this guild.',
    category: 'admin',
    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '[new prefix]',
    permissions: 'ADMINISTRATOR',
    callback: async (message, arguments) => {
        const prefix = arguments[0]

        if (prefix.length !== 1) {
            reply.replyExclaim(message, 'Your new prefix may only be one character!')
            return
        }

        await mongo().then(async mongoose => {
            try {
                const guildId = message.guild.id

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