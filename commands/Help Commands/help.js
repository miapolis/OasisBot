const discord = require("discord.js")
const { prefix } = require('../../config.json')

const loadCommands = require('../load-commands')
const config = require('../../config.json')

const validCategories = [
    'commands',
    'profiles',
    'polls',
    'roles',
    'usage',
    'documentation',
    'info'
]

const upperDescription = "View our [documentation](https://sites.google.com/view/oasisbot/documentation)\n" +
    "If you would like to send feedback or report a bug, fill out [this form](https://forms.gle/nwWKRLNJtqHW6Vfq9)\nIf you would like to further support this bot, specify **&donate**";

module.exports = {
    commands: 'help',
    category: 'null',
    minArgs: 0,
    maxArgs: 1,
    callback: (message, arguments, text) => {

        const subCategory = arguments[0]
        const subCategoryTitle = subCategory ? subCategory.charAt(0).toUpperCase() + subCategory.slice(1) : ''

        console.log('SUBCATERGORY IS: ', subCategory)

        if (!subCategory) {
            let mainHelpEmbed = new discord.MessageEmbed()
                .setTitle('Help')
                .setColor('AQUA')
                .setDescription(
                    upperDescription + '\n\n' +
                    `**${prefix}help commands**` + '\n' +
                    'Get help with custom commands!' + '\n\n' +
                    `**${prefix}help profiles**` + '\n' +
                    'Get help with profiles!' + '\n\n' +
                    `**${prefix}help polls**` + '\n' +
                    'Get help with polls!' + '\n\n' +
                    `**${prefix}help roles**` + '\n' +
                    `Get help with this guild's roles!` + '\n\n' +
                    `**${prefix}help usage**` + '\n' +
                    'Get help with the usage of this bot!' + '\n\n' +
                    `**${prefix}help documentation**` + '\n' +
                    'Get help with the OasisBot documentation!' + '\n\n' +
                    `**${prefix}help info**` + '\n' +
                    'Get info about this bot!'
                );

            message.channel.send(mainHelpEmbed);
            return
        }

        //Category help

        if (!validCategories.includes(subCategory.toLowerCase())) {
            message.channel.send(`Do you need help? Use **${config.prefix}help**`)
            return
        }

        const commands = loadCommands()

        let commandsString = ''

        for (const command of commands) {
            if (command.category.toLowerCase() === subCategory.toLowerCase()) {
                let permissions = command.permissions

                if (permissions) {
                    let hasPermission = true

                    if (typeof (permissions) === 'string') {
                        permissions = [permissions]
                    }

                    for (const permission of permissions) {
                        if (!message.member.hasPermission(permission)) {
                            hasPermission = false
                            break
                        }
                    }

                    if (!hasPermission) {
                        continue
                    }
                }

                const mainCommand = typeof command.commands === 'string' ? command.commands : command.commands[0]
                const args = command.expectedArgs ? ` ${command.expectedArgs}` : ''
                const permissionString = permissions ? permissions.join(', ') : 'None'
                const { description } = command

                commandsString += ("`" + `${config.prefix}${mainCommand}` + args + "`" + ` *(permissions: ${permissionString})*` + `\n**Description:** ${description}` + "\n\n")
            }
        }

        let catergoryEmbed = new discord.MessageEmbed().setTitle(subCategoryTitle).setDescription(commandsString).setColor('AUQA')

        message.channel.send(catergoryEmbed)
    }
}