const Discord = require('discord.js')
const customCommands = require('../../custom-commands')
const commandBase = require('../command-base')
const bot = require('../../bot')

const embedColor = require('../../embed-color.json')
const reply = require('../../message-reply')
const { defaultTimeout } = require('../../config.json')

module.exports = {
    commands: ['announcement', 'announce'],
    category: 'null',
    description: 'Sends an pre-made embed command in the given announcement channel',
    permissions: 'ADMINISTRATOR',
    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '[command name] [channel name]',
    callback: async (message, arguments) => {
        const prefix = commandBase.getGuildPrefix(message.guild.id)
        const inputCommandName = arguments[0].toLowerCase()
        const inputChannelName = arguments[1]

        const foundCommand = await customCommands.getCustomCommand(inputCommandName)

        if (!foundCommand) {
            message.channel.send(new Discord.MessageEmbed({
                title: 'Command not Found',
                description: `Hmm... That command doesn't seems to exist. Try finding it in **${prefix}commands**.`,
                color: embedColor.WARM_RED
            }))
            return
        }

        if (foundCommand.customCommandType !== 3) {
            reply.replyExclaim(message, 'That command is not an embed command. Regular commands can simply be spoken themselves without a need for a bot.')
            return
        }

        command = foundCommand

        const foundChannel = bot.getClient().channels.cache.find(x => x.name === inputChannelName)

        if (!foundChannel) {
            reply.replyExclaim(message, 'Something went wrong. Please try again later.')
            return
        }

        //#region Construct Embed

        const d = command.defaultResponse.embed
        const color = d.hexColor ? '#' + ((Number)(d.hexColor)).toString(16) : undefined

        let embed = new Discord.MessageEmbed({
            title: d.title,
            description: d.description ? d.description : undefined,
            color: color ? color : undefined,
            fields: d.fields ? d.fields : undefined
        })

        if (d.thumbnailURL) {
            embed.setThumbnail(d.thumbnailURL)
        }

        if (d.footer.text) {
            embed.setFooter(d.footer.text, d.footer.iconURL)
        }

        //#endregion

        await foundChannel.send(embed)

        reply.replyExclaim(message, 'Your embed has been sent!')
    }
}