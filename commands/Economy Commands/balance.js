const economy = require('../../economy')
const { MessageEmbed } = require('discord.js')

module.exports = {
    commands: ['balance', 'bal'],
    description: "Check's specified user's balance",
    category: "commands",
    maxArgs: 1,
    expectedArgs: `<user>`,
    callback: async (message) => {
        const target = message.mentions.users.first() || message.author

        const userId = target.id
        const guildId = message.guild.id

        const coins = await economy.getCoins(guildId, userId)

        let embed = new MessageEmbed().setTitle(coins).setDescription(`${target.username} has ${coins} coins.`)

        message.channel.send(embed)
    }
}