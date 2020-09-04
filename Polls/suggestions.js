const Discord = require('discord.js')

const channelId = '750394821897879722'
const thumbsup = '👍'
const thumbsdown = '👎'

module.exports = (bot) => {
    bot.on('message', message => {
        if (message.channel.id === channelId) {
            message.react(thumbsup);
            message.react(thumbsdown);
        }
    })
}