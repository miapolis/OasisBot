const Discord = require('discord.js')
const leveling = require('../../Leveling/leveling')

module.exports = {
    commands: 'setlvl',
    description: 'Sets the MEE6 level of the specified user. For the occasion the leveling fails.',
    category: 'profiles',
    permissions: 'ADMINISTRATOR',
    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '[member] [level]',
    callback: async (message, arguments, text) => {
        const mention = message.mentions.members.first()

        const level = arguments[1]

        if (!level || !mention) {
            message.reply('Please try again.')
            return
        }

        const guildId = message.guild.id
        const userId = mention.id

        const result = await (leveling.updateProfile(guildId, userId, level))

        message.channel.send(`Profile updated to level ${level}!`)
    }
}