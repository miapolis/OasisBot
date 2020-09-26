const Discord = require('discord.js')
const customCommands = require('../../custom-commands')
const botScript = require('../../bot')
const { defaultTimeout, prefix } = require('../../config.json')
const reply = require('../../message-reply')
const embedColor = require('../../embed-color.json')
const { mongo } = require('mongoose')

module.exports = {
    commands: 'report',
    description: 'Test command for embed cc',
    category: 'commands',
    minArgs: 0,
    callback: async (message) => {
        let embed = new Discord.MessageEmbed({
            title: 'Here is Your Report'
        })

        await customCommands.addCustomCommand('co', { message: '', embed: embed }, 1, [], 3)

        reply.replyExclaim(message, 'Added!')
    }
}