const Discord = require('discord.js')

module.exports.replyExclaim = (message, content, optionalUser = null) => {
    if (optionalUser === null) {
        message.channel.send(`<:Exclaim:754831964040593429> **${message.member.displayName}**, ${content}`)
    }
    else {
        message.channel.send(`<:Exclaim:754831964040593429> **${message.member.displayName}**, ${content}`)
    }
}

module.exports.replyTimeout = (message, content, optionalUser = null) => {
    if (optionalUser === null) {
        message.channel.send(`<:Timeout:754849977510920292> **${message.member.displayName}**, ${content}`)
    }
    else {
        message.channel.send(`<:Timeout:754849977510920292> <@${optionalUser.id}>, ${content}`)
    }
}

