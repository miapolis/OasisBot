const Discord = require('discord.js')
const customCommands = require('../../custom-commands')
const botScript = require('../../bot')

module.exports = {
    commands: 'commands',
    description: 'Returns an embed with all commands in the database',
    category: 'commands',
    minArgs: 0,
    callback: async (message) => {
        const arr = customCommands.getAllInCache()
        let newArr = []

        for (let command of arr) {
            newArr.push("`" + command.toString() + "`")
        }

        let embed = new Discord.MessageEmbed({
            title: 'Added Commands',
            description: "Commands: " + `${newArr.join(', ')}`,
            color: 'GREEN'
        })

        message.channel.send(embed)
    }
}