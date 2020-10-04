const Discord = require('discord.js')
const pollSystem = require('../../Polls/polling-system')
const commandBase = require('../command-base')

const embedColor = require('../../embed-color.json')

module.exports = {
    commands: 'viewpolls',
    category: 'polls',
    description: 'Shows a list of all running polls and their IDs.',
    permissions: 'ADMINISTRATOR',
    minArgs: 0,
    callback: async (message) => {
        const allPolls = pollSystem.getAllInCache()
        const prefix = commandBase.getGuildPrefix(message.guild.id)

        let descString = ''

        for (const poll in allPolls) {
            const act = allPolls[poll] //The loop just gives us the index so we have to do this
            const pMessage = act.pollMessage

            const abrDesc = act.originalContent.slice(0, 30).trim() + "..."

            descString += `[${poll}](https://discordapp.com/channels/${pMessage.guild.id}/${pMessage.channel.id}/${poll})\n${abrDesc}\n\n`
        }

        message.channel.send(new Discord.MessageEmbed({
            title: 'Running Polls',
            description: descString !== '' ? descString : `There doesn't seem to be any running polls! Use **${prefix}poll** to create a new poll.`,
            color: embedColor.STREET_BLUE
        }))
    }
}