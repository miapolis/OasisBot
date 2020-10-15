const Discord = require('discord.js')
const customCommands = require('../../custom-commands')
const commandBase = require('../command-base')

const embedColor = require('../../embed-color.json')

module.exports = {
    commands: 'cstats',
    category: 'commands',
    description: 'Shows the stats of given command.',
    minArgs: 1,
    maxArgs: 1,
    permissions: 'ADMINISTRATOR',
    expectedArgs: '[command name]',
    callback: async (message, args) => {
        const prefix = commandBase.getGuildPrefix(message.guild.id)
        const found = await customCommands.getCustomCommand(args[0].toLowerCase())

        if (!found) {
            message.channel.send(new Discord.MessageEmbed({
                title: 'That Command Does Not Exist',
                description: "Need help? Type in " + `**${prefix}help**\n` + `Looking for a custom command? Use **${prefix}help commands** or **${prefix}commands**`,
                color: 'RED'
            }))

            return
        }

        let channelString = ''
        let commandType = ''
        let channelModeString = 'Invalid Channels'

        switch (found.customCommandType) {
            case 1:
                commandType = 'Basic'
                break
            case 2:
                commandType = 'Random'
                break
            case 3:
                commandType = 'Embed'
                break
            default:
                commandType = '?'
                break
        }

        if (found.invalidChannelIds && found.invalidChannelIds.length !== 0) { //Mode is invalid channels
            for (const id of found.invalidChannelIds) {
                channelString += `<#${id}> `
            }
        }
        else if (found.validChannelIds && found.validChannelIds.length !== 0) {
            for (const id of found.validChannelIds) {
                channelString += `<#${id}> `
            }

            channelModeString = 'Valid Channels'
        }

        channelString = channelString === '' ? 'None' : channelString

        const embed = new Discord.MessageEmbed({
            title: found.commandName,
            color: embedColor.CORNFLOWER_BLUE
        })
        .addField('Type', commandType, true)
        .addField(channelModeString, channelString, true)

        if (found.customCommandType === 1) {
            embed.setDescription(found.defaultResponse.message)
        }

        if (found.customCommandType === 2) 
            embed.addField('Responses', found.amountOfResponses)

        if (found.customCommandType === 3) {
            const d = found.defaultResponse.embed
            const color = d.hexColor ? '#' + ((Number)(d.hexColor)).toString(16) : undefined
            embed.setColor(color)
        }
           
        await message.channel.send(embed)
    }
}