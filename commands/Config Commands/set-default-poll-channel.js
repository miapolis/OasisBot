const Discord = require('discord.js')
const mongo = require('../../mongo')
const bot = require('../../bot')

const guildConfigSchema = require('../../schema/guild-config')

const reply = require('../../message-reply')

module.exports = {
    commands: 'default-poll-channel',
    category: 'admin',
    description: 'Sets the default poll channel.',
    permissions: 'ADMINISTRATOR',
    minArgs: 1,
    maxArgs: 2,
    expectedArgs: '[channel-name / channel-mention]',
    callback: async (message, args) => {
        const guildId = message.guild.id

        let input = '' //No typescript so I have to do this
        input = args[0]

        //Determine if they said general, <#248923742342>, or something else

        const indexOfHash = input.indexOf('#')
        if (indexOfHash !== -1) {
            const closing = input.lastIndexOf('>')
            const id = input.slice(indexOfHash + 1, closing)

            await updateId(guildId, id)

            reply.replyExclaim(message, 'Updated!')
            return
        }

        const foundChannel = bot.getClient().channels.cache.find(x => x.name === input)

        if (foundChannel) {
            await updateId(guildId, foundChannel.id)
            reply.replyExclaim(message, 'Updated!')
            return
        } else { //Maybe they just typed in the id? 
            const correspondingChannel = bot.getClient().channels.cache.get(input)

            if (correspondingChannel) {
                await updateId(guildId, correspondingChannel.id)
                reply.replyExclaim(message, 'Updated!')
                return
            }
            else {
                reply.replyExclaim(message, `Hmm... that channel doesn't seem to exist!`)
                return
            }
        }
    }
}

updateId = async (guildId, id) => {
    await mongo().then(async mongoose => {
        try {
            await guildConfigSchema.findOneAndUpdate({
                _id: guildId
            }, {
                _id: guildId,
                defaultPollChannel: id
            }, {
                upsert: true,
                useFindAndModify: false
            })
        } finally {
            mongoose.connection.close()
        }
    })
}