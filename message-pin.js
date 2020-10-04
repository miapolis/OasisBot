const Discord = require('discord.js');
const mongoose = require('mongoose');
const commandBase = require('./commands/command-base')

const defaultMessagePinAmount = 5;
const pinEmoji = '📌'

const mongo = require('./mongo')
const guildConfigSchema = require('./schema/guild-config')

const pinAmountCache = {} // { 'guildId' : 'amount' }

module.exports.startup = async (bot) => {
    await mongo().then(async (mongoose) => {
        try {
            for (const guild of bot.guilds.cache) {
                const guildId = guild[1].id

                const result = await guildConfigSchema.findOne({ _id: guildId })
                pinAmountCache[guildId] = result ? result.requiredPinAmount : 5
            }
        } finally {
            mongoose.connection.close()
        }
    })

    bot.on('messageReactionAdd', (reaction, user) => {
        if (reaction.emoji.name === pinEmoji) { //They added a pin reaction
            const pinAmount = pinAmountCache[reaction.message.guild.id] || defaultMessagePinAmount

            if (!reaction.message.pinned && reaction.message.reactions.cache.find(x => x.emoji.name === pinEmoji).count >= pinAmount) {
                reaction.message.pin()
            }
        }
    })
}

module.exports.updateCache = (guildId, value) => {
    pinAmountCache[guildId] = value
}