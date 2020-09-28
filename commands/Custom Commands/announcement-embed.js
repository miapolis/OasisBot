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
    callback: async (message) => {
        const prefix = commandBase.getGuildPrefix(message.guild.id)

        await message.channel.send(new Discord.MessageEmbed({
            title: 'Enter the Name of the Command',
            description: `Specify your pre-created embed command's name below.\nDon't have one? Use **${prefix}addcommand** and select embed command**\nDon't know which command? Use **${prefix}commands`,
            color: embedColor.LIGHT_GREEN
        }))

        let command

        await message.channel.awaitMessages((x => x.author.id === message.author.id), { max: 1, time: defaultTimeout }).then(async collected => {
            const result = collected.first().content.toLowerCase()

            const foundCommand = await customCommands.getCustomCommand(result)

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
        })

        await message.channel.send(new Discord.MessageEmbed({
            title: 'Type in the Name of Your Channel',
            description: "This will be the channel the embed is sent in. Be careful not to mention the channel, but rather just type it's name in.",
            color: embedColor.STREET_BLUE
        })
            .addField('Cancel', `${prefix}cancel`)
        )

        await message.channel.awaitMessages((x => x.author.id === message.author.id), { max: 1, time: defaultTimeout }).then(async collected => {
            const result = collected.first().content.toLowerCase()

            if (result === `${prefix}cancel`) {
                reply.replyExclaim(message, 'Canceled!')
                return
            }

            const foundChannel = bot.getClient().channels.cache.find(x => x.name === result)

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
        })
    }
}