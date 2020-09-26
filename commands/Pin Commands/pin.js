const Discord = require('discord.js')

module.exports = {
    commands: 'pin',
    description: 'Pins a message.',
    category: 'null',
    callback: async (message) => {
        message.pin()
    }
}