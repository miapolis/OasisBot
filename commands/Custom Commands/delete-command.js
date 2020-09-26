const Discord = require('discord.js')
const customCommands = require('../../custom-commands')
const commandBase = require('../command-base')
const bot = require('../../bot')
const { defaultTimeout } = require('../../config.json')

const embedColor = require('../../embed-color.json')
const messageReply = require('../../message-reply')
const timeHelper = require('../../time-helper')

module.exports = {
    commands: ['deletecommand', 'delcommand'],
    description: 'Deletes a command. Will prompt for name of the command and verify.',
    category: 'commands',
    permissions: 'ADMINISTRATOR',
    callback: async (message) => {
        const prefix = commandBase.getGuildPrefix(message.guild.id)

        await message.channel.send(new Discord.MessageEmbed({
            title: 'Delete a Command',
            description: "What is the command's name? Respond below.",
            color: embedColor.FRIENDLY_RED
        }).setFooter('Oasis Database • Remove a command', bot.getClient().user.displayAvatarURL()).addField('Cancel', `${prefix}cancel`))

        const ignoreId = message.author.id
        customCommands.pushNewUserToIgnore(ignoreId, 'INITIATED DELETECOMMAND SEQ.')

        const filter = x => x.author.id === message.author.id
        const commandNameMessageCollector = await message.channel.createMessageCollector(filter, { time: defaultTimeout, max: 1 })

        await commandNameMessageCollector.on('collect', async collected => {
            const response = collected.content.toLowerCase()

            if (response === `${prefix}cancel`) {
                messageReply.replyExclaim(message, 'Canceled!')
                customCommands.removeUserToIgnore(ignoreId, 'CANCELED DELETECOMMAND SEQ.')
                return
            }

            const result = await customCommands.getCustomCommand(response)

            if (!result) {
                await message.channel.send(new Discord.MessageEmbed({
                    title: "That Command Doesn't Exist",
                    description: "That command doesn't seem to exist...",
                    color: embedColor.FRIENDLY_RED
                })
                    .addField('Looking for all commands?', `${prefix}commands`)
                    .setFooter('Oasis Database • Command not found', bot.getClient().user.displayAvatarURL())
                )

                customCommands.removeUserToIgnore(ignoreId, 'FAILED DELETECOMMAND SEQ.')

                return
            }

            console.log('PREPARING TO DELETE DOCUMENT', result.commandName)

            const confirmationMessage = await message.channel.send(new Discord.MessageEmbed({
                title: 'Confirm',
                description: `Command **${result.commandName}** will be deleted. Are you sure?`,
                color: embedColor.WARM_RED
            }))

            await confirmationMessage.react('✅')
            await confirmationMessage.react('❌')

            const reactionFilter = (reaction, user) => user.id === message.author.id

            await confirmationMessage.awaitReactions(reactionFilter, { time: defaultTimeout, max: 1 }).then(async collected => {
                const reaction = collected.first()

                if (reaction.emoji.name === '❌') {
                    messageReply.replyExclaim(message, 'Canceled!')
                    customCommands.removeUserToIgnore(ignoreId, 'CANCELED DELETECOMMAND SEQ.')
                    return
                }
                else if (reaction.emoji.name === '✅') {
                    await message.channel.send(new Discord.MessageEmbed({
                        title: 'Loading...',
                        description: 'Hang on.',
                        color: embedColor.CORNFLOWER_BLUE
                    }).setFooter('Oasis Database · Deleting command', bot.getClient().user.displayAvatarURL()))

                    await customCommands.deleteCustomCommand(result.commandName)

                    setTimeout(async () => {
                        await message.channel.send(new Discord.MessageEmbed({
                            title: 'Command Successfully Deleted',
                            description: `Your command, ${result.commandName}, has been deleted.`,
                            color: embedColor.SUCCESS_GREEN
                        }).setFooter(`Oasis Database · Modified at ${timeHelper.getFormattedMilitaryTime()}`, bot.getClient().user.displayAvatarURL()))

                        customCommands.removeUserToIgnore(ignoreId, 'SUCCESSFULLY DELETED COMMAND')
                    }, 2000)
                }
            })

        })
    }
}