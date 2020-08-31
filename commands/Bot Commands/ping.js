const { MessageEmbed } = require("discord.js")

//HLHbZf4o5McSjVq3

module.exports = {
    commands: 'ping',
    description: 'Logs ping of current client and API.',
    category: 'info',
    callback: (message, arguments, text, bot) => {
        message.channel.send('**Testing ping...**').then(async result => {
            const ping = result.createdTimestamp - message.createdTimestamp

            const messageString = `Bot latency: ${ping}, API latency: ${bot.ws.ping}`
            let embed = new MessageEmbed().setColor('GOLD').setTitle('Ping Information').setDescription(messageString);

            setTimeout(() => {
                result.edit(embed)
            }, 2000)
        })
    }
}
