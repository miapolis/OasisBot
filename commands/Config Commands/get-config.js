const Discord = require('discord.js')
const commandBase = require('../command-base')

const mongo = require('../../mongo')
const guildConfigSchema = require('../../schema/guild-config')

const embedColor = require('../../embed-color.json')

module.exports = {
    commands: 'config',
    description: 'Shows a menu for how this bot is configured for this guild.',
    category: 'admin',
    permissions: 'ADMINISTRATOR',
    minArgs: 0,
    maxArgs: 0,
    callback: async (message) => {
        const guildId = message.guild.id
        const prefix = commandBase.getGuildPrefix(guildId)

        await mongo().then(async mongoose => {
            try {
                const config = await guildConfigSchema.findOne({
                    _id: guildId
                })

                const prefix = config ? config.prefix : commandBase.getGuildPrefix(guildId)

                let configEmbed = new Discord.MessageEmbed({
                    title: 'Your Config',
                    description: `Change these properties by using **${prefix}[property name]**.`,
                    color: embedColor.STREET_BLUE
                }).addField('prefix', prefix, true).addField('pin-amount', config.requiredPinAmount ? config.requiredPinAmount : 5, true)
                    .addField('default-poll-channel', config.defaultPollChannel ? `<#${config.defaultPollChannel}>` : 'Not set up yet!')

                message.channel.send(configEmbed)
            } finally {
                mongoose.connection.close()
            }
        })
    }
}