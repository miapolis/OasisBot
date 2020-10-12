const Discord = require('discord.js')
const pollSystem = require('../../Polls/polling-system')
const commandBase = require('../command-base')
const customCommands = require('../../custom-commands')
const bot = require('../../bot')

const mongo = require('../../mongo')
const guildConfigSchema = require('../../schema/guild-config')

const embedColor = require('../../embed-color.json')
const reply = require('../../message-reply')
const { defaultTimeout } = require('../../config.json')

module.exports = {
    commands: 'poll',
    category: 'polls',
    description: 'Creates a new poll.',
    permissions: 'ADMINISTRATOR',
    minArgs: 0,
    callback: async (message) => {
        const guildId = message.guild.id
        let config, defChannelId

        customCommands.pushNewUserToIgnore(message.author.id, 'INITIATED CREATE_POLL SEQ.')

        await mongo().then(async mongoose => {
            try {
                config = await guildConfigSchema.findOne({ _id: guildId })
            } finally {
                mongoose.connection.close()
            }
        })

        const prefix = commandBase.getGuildPrefix(guildId)
        const filter = x => x.author.id === message.author.id
        const channel = message.channel
        let isIncognito = false

        const selectTypeEmbed = await channel.send(new Discord.MessageEmbed({
            title: 'Choose Type of Poll',
            description: 'Select the type of poll you would like to create.',
            color: embedColor.STREET_BLUE
        })
            .addField(':regional_indicator_a: - Regular Poll', 'Regular poll where all reactions are visible.')
            .addField(':regional_indicator_b: - Incognito Poll', 'Responses are private and anonymous. Members react via DMs with the bot.')
        )

        await selectTypeEmbed.react('🇦')
        await selectTypeEmbed.react('🇧')

        await selectTypeEmbed.awaitReactions((x => x.emoji.name === '🇦' || x.emoji.name === '🇧'), { max: 1, time: defaultTimeout }).then(async collected => {
            const reaction = collected.first()

            if (reaction.emoji.name === '🇧') {
                isIncognito = true
            }
        })

        defChannelId = config ? config.defaultPollChannel : ''

        if (defChannelId === '') { //Let's get the channel set up
            await channel.send(new Discord.MessageEmbed({
                title: 'Setup Your Default Channel',
                description: 'This will be where your polls are sent.\nSimply type in the name of your channel without mentioning it.',
                color: embedColor.LIGHT_GREEN
            })
                .addField('Cancel', `${prefix}cancel`)
            )

            await channel.awaitMessages(filter, { max: 1, time: defaultTimeout }).then(async collected => {
                const content = collected.first().content

                if (content.toLowerCase() === `${prefix}cancel`) {
                    reply.replyExclaim(message, 'Canceled!')
                    customCommands.removeUserToIgnore(message.author.id, 'CANCELED CREATE_POLL SEQ.')
                    return
                }

                const foundChannel = message.guild.channels.cache.find(x => x.name === content)

                if (!foundChannel) {
                    reply.replyExclaim(message, `Hmm... that channel doesn't seem to exist!`)
                    customCommands.removeUserToIgnore(message.author.id, 'FAILED CREATE_POLL SEQ.')
                    return
                }

                await channel.send(new Discord.MessageEmbed({
                    title: 'Loading...',
                    description: 'Hang on.',
                    color: embedColor.CORNFLOWER_BLUE
                }))

                await mongo().then(async mongoose => {
                    try {
                        await guildConfigSchema.findOneAndUpdate({
                            _id: guildId
                        }, {
                            _id: guildId,
                            defaultPollChannel: foundChannel.id
                        }, {
                            upsert: true,
                            useFindAndModify: false
                        })
                        defChannelId = foundChannel.id
                    } finally {
                        mongoose.connection.close()
                    }
                })
            })
        } //At this point we should already have the channel set up

        let pollContent, duration = ''
        let emojis = []
        let enterEmoji = ''

        await channel.send(new Discord.MessageEmbed({
            title: 'Poll Content',
            description: 'What will your poll say?',
            color: embedColor.FRIENDLY_RED
        })
            .addField('Cancel', `${prefix}cancel`))

        await channel.awaitMessages(filter, { max: 1, time: defaultTimeout }).then(async collected => {
            const content = collected.first().content

            if (content.toLowerCase() === `${prefix}cancel`) {
                reply.replyExclaim(message, 'Canceled!')
                customCommands.removeUserToIgnore(message.author.id, 'CANCELED CREATE_POLL SEQ.')
                return
            }

            pollContent = content
        })

        if (isIncognito) {
            const enterEmojiEmbed = await channel.send(new Discord.MessageEmbed({
                title: 'Configure Your Enter Emoji',
                description: 'This will be the emoji members need to react with to enter the poll',
                color: embedColor.CORNFLOWER_BLUE
            })
                .addField('Cancel', `${prefix}cancel`)
            )

            await channel.awaitMessages(filter, { max: 1, time: defaultTimeout }).then(async collected => {
                const content = collected.first().content

                if (content.toLowerCase() === `${prefix}cancel`) { reply.replyExclaim(message, 'Canceled!'); customCommands.removeUserToIgnore(message.author.id, 'CANCELED CREATE_POLL SEQ.'); return }

                enterEmoji = content
            })
        }

        await channel.send(new Discord.MessageEmbed({
            title: 'Configure Your Reactions',
            description: 'These will be the reactions members can react with.\nType the emojis with spaces seperating them.\nExample: :white_check_mark: :thumbsup: :thumbsdown:',
            color: embedColor.LIGHT_GREEN
        }).addField('Cancel', `${prefix}cancel`))

        await channel.awaitMessages(filter, { max: 1, time: defaultTimeout }).then(async collected => {
            const content = collected.first().content
            if (content.toLowerCase() === `${prefix}cancel`) { reply.replyExclaim(message, 'Canceled!'); customCommands.removeUserToIgnore(message.author.id, 'CANCELED CREATE_POLL SEQ.'); return }

            const arr = content.split(' ')
            emojis = arr
        })

        await channel.send(new Discord.MessageEmbed({
            title: 'Configure Your Duration',
            description: 'How long will the poll last? e.g. 3d, 10s, 2w, 12h, etc.',
            color: embedColor.STREET_BLUE
        }))

        const numberRegex = /^\d+$/

        await channel.awaitMessages(filter, { max: 1, time: defaultTimeout }).then(async collected => {
            const content = collected.first().content.toLowerCase()
            if (content === `${prefix}cancel`) { reply.replyExclaim(message, 'Canceled!'); customCommands.removeUserToIgnore(message.author.id, 'CANCELED CREATE_POLL SEQ.'); return }

            const checkDuration = pollSystem.getEndTimestamp(content)

            if (!numberRegex.test(checkDuration)) {
                reply.replyExclaim(message, checkDuration)
                customCommands.removeUserToIgnore(message.author.id, 'FAILED CREATE_POLL SEQ.')
                return
            }

            duration = content
        })

        const defChannel = bot.getClient().channels.cache.get(defChannelId)

        if (!isIncognito) {
            pollSystem.addPoll(message, defChannel, emojis, pollContent, duration)
        }
        else {
            pollSystem.addIncognitoPoll(message, defChannel, emojis, enterEmoji, pollContent, duration)
        }

        customCommands.removeUserToIgnore(message.author.id, 'SUCCESS CREATE_POLL SEQ.')
    }
}