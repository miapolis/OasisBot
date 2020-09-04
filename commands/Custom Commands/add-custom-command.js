const Discord = require('discord.js')
const customCommands = require('../../custom-commands')
const botScript = require('../../bot')

module.exports = {
    commands: 'addcommand',
    description: 'Adds a new command. Will prompt for all required parameters.',
    category: 'commands',
    minArgs: 2,
    expectedArgs: '[name] [response]',
    permissions: 'ADMINISTRATOR',
    callback: async (message, arguments) => { //Text won't be used since we will join ourselves
        const commandName = arguments[0]

        arguments.shift()

        const text = arguments.join(' ')

        await customCommands.addCustomCommand(
            botScript.getClient(),
            commandName,
            text,
            1,
            [],
            1
        )
        message.reply('Added!')
    }
}