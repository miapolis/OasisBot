const Discord = require('discord.js')
const customCommands = require('../../custom-commands')
const commandBase = require('../command-base')
const bot = require('../../bot')

const { defaultTimeout } = require('../../config.json')

const reply = require('../../message-reply')
const embedColor = require('../../embed-color.json')
const timeHelper = require('../../time-helper')
const { clearPoll } = require('../../Polls/poll-database')
const { set } = require('mongoose')

//#region Locked Definitions

const ignoreNameConstant = 'EDITCOMMAND'

//#endregion

//#region Emojis and Defenitions

//#region Random

const randomEditorEmojis = [
    '⬅️',
    '➡️',
    '🔢',
    '🆕',
    '🚫',
    '✅',
    ':arrow_left:',
    ':arrow_right:',
    ':1234:',
    ':new:',
    ':no_entry_sign:',
    ':white_check_mark:',
]

//#endregion

//#region Embed

//#endregion

//#endregion

module.exports = {
    commands: 'editcommand',
    category: 'commands',
    description: 'Initiates the command editor sequence.',
    minArgs: 0,
    permissions: 'ADMINISTRATOR',
    callback: async (message) => {
        //Defenitions
        const channel = message.channel
        const member = message.member
        const userId = member.user.id
        const guild = message.guild
        const prefix = commandBase.getGuildPrefix(guild.id)
        var self = this

        const replyFilter = x => x.author.id === member.user.id

        customCommands.pushNewUserToIgnore(userId, 'INITIATED EDITCOMMAND SEQ.')

        await channel.send(new Discord.MessageEmbed({
            title: 'Edit a Command',
            description: "What is your command's name? Respond below.",
            color: embedColor.STREET_BLUE
        })
            .addField('Cancel', `Use ${prefix}cancel`)
            .setFooter('Oasis Database • Edit command', bot.getClient().user.displayAvatarURL())
        )

        await channel.awaitMessages(replyFilter, { max: 1, time: defaultTimeout }).then(async collected => {
            const content = collected.first().content.toLowerCase()

            if (content === `${prefix}cancel`) { reply.replyExclaim(message, 'Canceled!'); removeIgnore(userId, 1); return }

            const result = await customCommands.getCustomCommand(content)

            if (!result) { reply.replyExclaim(message, "Hmm... that command doesn't seem to exist."); removeIgnore(userId, 2); return }

            //Get the command type and start the unique editor for each

            switch (result.customCommandType) {
                case 1: //Basic
                    await initiateBasicCommandEditor(result, message, channel, member, userId, guild, prefix)
                    break
                case 2:
                    await initiateRandomCommandEditor(result, message, channel, member, userId, guild, prefix)
                    break
                case 3:
                    await initiateEmbedCommandEditor(result, message, channel, member, userId, guild, prefix)
                    break
            }
        })
    }
}

//#region Editor

//#region Basic Command Editor

initiateBasicCommandEditor = async (command, message, channel, member, userId, guild, prefix) => {
    const replyFilter = x => x.author.id === member.user.id

    let newCommandName = ''

    await promptRename(message, channel, member, userId, prefix, startEmbed)

    async function startEmbed(commandName) {
        newCommandName = commandName !== '' ? commandName : command.commandName

        await channel.send(new Discord.MessageEmbed({
            title: 'Command Response',
            description: 'Change what your command says. Currently set to:\n' + `${command.defaultResponse.message}`,
            color: embedColor.STREET_BLUE
        })
            .addField('Skip', `${prefix}skip`, true)
            .addField('Cancel', `${prefix}cancel`, true)
        )

        await channel.awaitMessages(replyFilter, { max: 1, time: defaultTimeout }).then(async collected => {
            let content = collected.first().content

            if (content.toLowerCase() === `${prefix}cancel`) { removeIgnore(userId, code); reply.replyExclaim('Canceled!'); return; }
            if (content.toLowerCase() === `${prefix}skip`) {
                content = command.defaultResponse.message
            }

            updateCommand(command.commandName, newCommandName, { message: content, embed: undefined }, 1, [], 1, channel, member.user, [[], []]) //(originalName, newName, defaultResponse, amountOfResponses, responses, customCommandType, channel, humanUser, channelIds)
        })
    }
}

//#endregion

//#region Random Command Editor

initiateRandomCommandEditor = async (command, message, channel, member, userId, guild, prefix) => {
    const replyFilter = x => x.author.id === userId
    const reactionFilter = (reaction, user) => {
        return user.id === userId
    }

    let newCommandName = ''

    await promptRename(message, channel, member, userId, prefix, startEmbed)

    async function startEmbed(commandName) {
        var currentPageIndex = 0
        newCommandName = commandName !== '' ? commandName : command.commandName
        let modResponses = command.responses
        let modAmountOfResponses = command.amountOfResponses

        const editorMessage = await channel.send(new Discord.MessageEmbed({
            title: `Edit Your Command - Page ${currentPageIndex + 1}`,
            description: `Your command, ${newCommandName}, at response ${currentPageIndex + 1}, will respond with:\n\n${modResponses[currentPageIndex].message}\n`,
            color: embedColor.GOLD
        }
        )
            .addField('Change Response', 'Type in your new response', true)
            .addField('Next Response', `${randomEditorEmojis[7]}`, true)
            .addField('Previous Response', `${randomEditorEmojis[6]}`, true)
            .addField('Jump to Response', `${randomEditorEmojis[8]}`, true)
            .addField('Add New Response', `${randomEditorEmojis[9]}`, true)
            .addField('Delete This Response', `${randomEditorEmojis[10]}`, true)
            .addField('Done', `${randomEditorEmojis[11]}`, true)
            .addField('Cancel', `${prefix}cancel`)
            .setFooter('Oasis Database • Command editor', bot.getClient().user.displayAvatarURL())
        )

        for (let i = 0; i < 6; i++) {
            await editorMessage.react(randomEditorEmojis[i])
        }

        awaitInput = async () => {
            const reactionCollector = editorMessage.createReactionCollector(reactionFilter, { max: 1, time: defaultTimeout })
            const messsageCollector = channel.createMessageCollector(replyFilter, { max: 1, time: defaultTimeout })

            messsageCollector.on('collect', async collected => {
                reactionCollector.stop()
                const content = collected.content

                if (content.toLowerCase() === `${prefix}cancel`) { removeIgnore(userId, 1); reply.replyExclaim(message, 'Canceled!'); return; }

                modResponses[currentPageIndex] = { message: content, embed: null }
                loadResponsePage(true)

                collected.log = false
                try { await collected.delete() } catch (e) { }

                awaitInput()
            })

            reactionCollector.on('collect', async reaction => {
                messsageCollector.stop()
                removeReaction(editorMessage, userId)

                switch (reaction.emoji.name) {
                    case randomEditorEmojis[0]: //Back
                        prevResponse()
                        break
                    case randomEditorEmojis[1]: //Next
                        nextResponse()
                        break
                    case randomEditorEmojis[2]: //Jump
                        jump()
                        break
                    case randomEditorEmojis[3]: //New
                        newResponse()
                        break
                    case randomEditorEmojis[4]: //Delete
                        deleteResponse()
                        break
                    case randomEditorEmojis[5]: //Done
                        updateCommand(command.commandName, newCommandName, null, modAmountOfResponses, modResponses, command.customCommandType, channel, member.user, [[], []]) //(originalName, newName, defaultResponse, amountOfResponses, responses, customCommandType, channel, humanUser, channelIds)
                        break
                }
            })
        }

        awaitInput()

        //#region Functions

        prevResponse = async () => {
            currentPageIndex = currentPageIndex - 1 < 0 ? modAmountOfResponses - 1 : currentPageIndex - 1

            loadResponsePage()
            awaitInput()
        }

        nextResponse = async () => {
            currentPageIndex = currentPageIndex + 1 > modAmountOfResponses - 1 ? 0 : currentPageIndex + 1

            loadResponsePage()
            awaitInput()
        }

        jump = async () => {
            let messagesToBeDeleted = []

            const embed = await channel.send(new Discord.MessageEmbed({
                title: 'Jump to a Response',
                color: embedColor.LIGHT_GREEN
            })
                .addField('Min', '1', true)
                .addField('Max', `${modAmountOfResponses}`, true)
                .addField('Cancel', `${prefix}cancel`)
            )

            messagesToBeDeleted.push(embed)

            deleteAll = async () => {
                for (const message of messagesToBeDeleted) {
                    setTimeout(async () => {
                        message.log = false
                        try { await message.delete() } catch (e) { }
                    }, 700)
                }
            }

            await channel.awaitMessages(replyFilter, { max: 1, time: defaultTimeout }).then(async collected => {
                const collectedMessage = collected.first()
                messagesToBeDeleted.push(collectedMessage)
                const content = collectedMessage.content

                if (content.toLowerCase === `${prefix}cancel`) { removeIgnore(userId, 1); reply.replyExclaim(message, 'Canceled!'); return }

                var int = Number(content)

                await deleteAll()

                if (isNaN(int)) {
                    loadResponsePage(false, true, false, 'Invalid Syntax')
                }
                else if (int < 1 || int > modAmountOfResponses) {
                    loadResponsePage(false, true, false, `Must be Between 1 and ${modAmountOfResponses}`)
                } else {
                    currentPageIndex = int - 1
                    loadResponsePage(true)
                }

                awaitInput()
            })
        }

        newResponse = async () => {
            let messagesToBeDeleted = []

            const embed = await channel.send(new Discord.MessageEmbed({
                title: 'New Response',
                description: `This will be response number ${modAmountOfResponses + 1}. What will it be?`,
                color: embedColor.CORNFLOWER_BLUE
            })
                .addField('Cancel', `${prefix}cancel`)
            )

            messagesToBeDeleted.push(embed)

            deleteAll = async () => {
                for (const message of messagesToBeDeleted) {
                    setTimeout(async () => {
                        message.log = false
                        try { await message.delete() } catch (e) { }
                    }, 700)
                }
            }

            await channel.awaitMessages(replyFilter, { max: 1, time: defaultTimeout }).then(async collected => {
                const collectedMessage = collected.first()
                messagesToBeDeleted.push(collectedMessage)
                const content = collectedMessage.content

                if (content.toLowerCase === `${prefix}cancel`) { removeIgnore(userId, 1); reply.replyExclaim(message, 'Canceled!'); return }

                await deleteAll()

                modResponses.push({ message: content, embed: null })
                currentPageIndex = modAmountOfResponses
                modAmountOfResponses++

                loadResponsePage(true)
                awaitInput()
            })
        }

        deleteResponse = async () => {
            if (modAmountOfResponses <= 2) {
                loadResponsePage(false, true, false, 'Too few responses to delete!')
                awaitInput()
                return
            }

            modResponses.splice(currentPageIndex, 1)
            modAmountOfResponses--

            await loadResponsePage(false, false, true)
            awaitInput()
        }

        loadResponsePage = async (pageUpdated = false, error = false, deleted = false, errorMessage) => {
            if (deleted) {
                await editorMessage.edit(new Discord.MessageEmbed({
                    title: editorMessage.embeds[0].title + " [DELETED]",
                    description: editorMessage.embeds[0].description,
                    fields: editorMessage.embeds[0].fields,
                    footer: editorMessage.embeds[0].footer
                })
                    .setColor(embedColor.WARM_RED)
                )

                setTimeout(async () => {
                    currentPageIndex = currentPageIndex - 1 < 0 ? modAmountOfResponses - 1 : currentPageIndex - 1
                    loadResponsePage()
                }, 500)

                return
            }

            const cachedTitle = editorMessage.embeds[0].title

            await editorMessage.edit(new Discord.MessageEmbed({
                title: error ? (errorMessage ? errorMessage : cachedTitle) : `Edit Your Command - Page ${currentPageIndex + 1}`,
                description: `Your command, ${newCommandName}, at response ${currentPageIndex + 1}, will respond with:\n\n${modResponses[currentPageIndex].message}\n`,
                fields: editorMessage.embeds[0].fields,
                footer: editorMessage.embeds[0].footer
            })
                .setColor(pageUpdated && !error ? embedColor.LIGHT_GREEN : !error ? embedColor.GOLD : embedColor.WARM_RED)
            )

            if (pageUpdated || error) {
                setTimeout(async () => {
                    await editorMessage.edit(new Discord.MessageEmbed({
                        title: cachedTitle,
                        description: editorMessage.embeds[0].description,
                        fields: editorMessage.embeds[0].fields,
                        footer: editorMessage.embeds[0].footer
                    })
                        .setColor(embedColor.GOLD)
                    )
                }, 550)
            }
        }

        //#endregion
    }
}

//#endregion

//#region Embed Command Editor

initiateEmbedCommandEditor = async (command, message, channel, member, userId, guild, prefix) => {
    reply.replyExclaim(message, 'At the moment, embed commands are disabled for editing. Come back when the feature is here!')
}

//#endregion

//#endregion

//#region Partial Steps

promptRename = async (message, channel, member, userId, prefix, callback) => {
    const replyFilter = x => x.author.id === member.user.id
    const namingRegex = /^[0-9A-Za-z\-]+$/

    await channel.send(new Discord.MessageEmbed({
        title: 'Rename Your Command',
        description: 'May only contain letters, numbers, and dashes.',
        color: embedColor.LIGHT_GREEN
    })
        .addField('Skip', `${prefix}skip`)
        .addField('Cancel', `${prefix}cancel`)
    )

    let done = false

    while (!done) {
        await channel.awaitMessages(replyFilter, { max: 1, time: defaultTimeout }).then(async collected => {
            const content = collected.first().content.toLowerCase()

            if (content === `${prefix}cancel`) { done = true; reply.replyExclaim(message, 'Canceled!'); removeIgnore(userId, 1); return }
            if (content === `${prefix}skip`) { callback(''); done = true; return }

            if (!namingRegex.test(content)) {
                reply.replyExclaim(message, "Your command's name may only contain letters, numbers, and dashes. Try again.")
            }
            else {
                //Check if a command with that name already exists
                const found = await customCommands.getCustomCommand(content)

                if (found !== false) {
                    reply.replyExclaim(message, "A command with that name already exists! Try again.")
                }
                else {
                    done = true
                    callback(content)
                }
            }
        })
    }
}

editChannelIds = async (command, message, channel, member, userId, prefix, callback) => {

}

//#endregion

//#region Locked

removeIgnore = (id, code) => { //0 SUCESS, 1 CANCEL, 2 FAILED
    switch (code) {
        case 0:
            customCommands.removeUserToIgnore(id, `SUCCESS COMPLETED ${ignoreNameConstant} SEQ.`)
            break;
        case 1:
            customCommands.removeUserToIgnore(id, `CANCELED ${ignoreNameConstant} SEQ.`)
            break;
        case 2:
            customCommands.removeUserToIgnore(id, `FAILED ${ignoreNameConstant} SEQ.`)
            break;
        default:
            customCommands.removeUserToIgnore(id, `${ignoreNameConstant} SEQ. [undefined]`)
            break;
    }
}

removeReaction = async (message, userId) => {
    const userReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(userId))
    try {
        for (const reaction of userReactions.values()) {
            await reaction.users.remove(userId)
        }
    } catch (error) {
        console.error('Failed to remove reactions.')
    }
}

//#endregion

updateCommand = async (originalName, newName, defaultResponse, amountOfResponses, responses, customCommandType, channel, humanUser, channelIds) => {
    channel.send(new Discord.MessageEmbed({
        title: 'Loading...',
        description: 'Hang on.',
        color: embedColor.CORNFLOWER_BLUE
    }).setFooter('Oasis Database · Updating command', bot.getClient().user.displayAvatarURL()))

    await customCommands.editCustomCommand(originalName, newName, defaultResponse, amountOfResponses, responses, customCommandType, channelIds)

    setTimeout(() => {
        channel.send(new Discord.MessageEmbed({
            title: 'Command Updated',
            description: `Your command, ${newName}, has been successfully updated.`,
            color: embedColor.SUCCESS_GREEN
        }).setFooter(`Oasis Database · Modified at ${timeHelper.getFormattedMilitaryTime()}`, bot.getClient().user.displayAvatarURL()))

        removeIgnore(humanUser.id, 0)
    }, 2000)
}