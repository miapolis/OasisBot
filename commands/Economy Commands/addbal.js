const economy = require('../../economy')
const Discord = require('discord.js')

module.exports = {
    commands: ['addbalance', 'addbal'],
    description: "Adds specified amount of coins to user's balance",
    category: 'commands',
    minArgs: 2,
    maxArgs: 2,
    expectedArgs: "[user] [amount]",
    permissionError: 'You must be an administrator to use this command.',
    permissions: 'ADMINISTRATOR',
    callback: async (message, arguments) => {
        const mention = message.mentions.users.first()

        if (!mention) {
            message.reply('Please tag a user to add coins to.')
            return
        }

        const coins = arguments[1]
        if (isNaN(coins)) {
            message.reply('Please provide a valid numnber of coins.')
            return
        }

        const guildId = message.guild.id
        const userId = mention.id

        const newCoins = await economy.addCoins(guildId, userId, coins)

        let embed = new Discord.MessageEmbed().setTitle(`+${coins}`).setDescription(`${mention.username} now has **${newCoins}** coins.`)

        message.channel.send(embed)
    }
}

