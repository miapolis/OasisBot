const discord = require("discord.js")

const loadCommands = require('../load-commands')
const config = require('../../config.json')
const commandBase = require('../command-base')

const prefixPlaceholder = '[%%]'

const validCategories = [
    'commands',
    'profiles',
    'polls',
    'documentation',
    'info',
    'admin'
]

module.exports = {
    commands: 'help',
    category: 'null',
    minArgs: 0,
    maxArgs: 1,
    callback: async (message, arguments, text) => {

        const prefix = commandBase.getGuildPrefix(message.guild.id)

        const upperDescription = "View our [documentation](https://sites.google.com/view/oasisbot/documentation)\n" +
            `If you would like to send feedback or report a bug, fill out [this form](https://forms.gle/nwWKRLNJtqHW6Vfq9)\nIf you would like to further support this bot, specify **${prefix}donate**`

        const subCategory = arguments[0]
        const subCategoryTitle = subCategory ? subCategory.charAt(0).toUpperCase() + subCategory.slice(1) : ''

        if (!subCategory) {
            let desc = upperDescription + '\n\n' +
                `**${prefix}help commands**` + '\n' +
                'Get help with custom commands!' + '\n\n' +
                `**${prefix}help profiles**` + '\n' +
                'Get help with profiles!' + '\n\n' +
                `**${prefix}help polls**` + '\n' +
                'Get help with polls!' + '\n\n' +
                `**${prefix}help documentation**` + '\n' +
                'Get help with the OasisBot documentation!' + '\n\n' +
                `**${prefix}help info**` + '\n' +
                'Get info about this bot!'

            let adminDesc = upperDescription + '\n\n' +
                `**${prefix}help commands**` + '\n' +
                'Get help with custom commands!' + '\n\n' +
                `**${prefix}help profiles**` + '\n' +
                'Get help with profiles!' + '\n\n' +
                `**${prefix}help polls**` + '\n' +
                'Get help with polls!' + '\n\n' +

                `**${prefix}help admin**` + '\n' +
                'Get help with admin commands for this bot!' + '\n\n' +
                `**${prefix}help documentation**` + '\n' +
                'Get help with the OasisBot documentation!' + '\n\n' +
                `**${prefix}help info**` + '\n' +
                'Get info about this bot!'

            let mainHelpEmbed = new discord.MessageEmbed()
                .setTitle('Help')
                .setColor('AQUA')
                .setDescription(
                    message.member.user.id !== config.botOwner ? (message.member.permissions.has('ADMINISTRATOR') ? adminDesc : desc) : adminDesc
                );

            message.channel.send(mainHelpEmbed);
            return
        }

        //Category help OR help for a specific command

        const commands = loadCommands()

        if (!validCategories.includes(subCategory.toLowerCase())) {
            let commandNamesArray = [] //Same code from custom comamnds

            for (const commandOption of commands) {
                if (typeof (commandOption.commands) === 'string') {
                    commandNamesArray.push(commandOption.commands)
                }
                else {
                    for (const alias of commandOption.commands) {
                        commandNamesArray.push(alias)
                    }
                }
            }

            for (const commandName of commandNamesArray) {
                if (commandName === subCategory.toLowerCase()) {
                    let fullCommand = commands.find(x => typeof (x.commands) === 'string' ? x.commands === commandName : x.commands.includes(commandName))

                    const permArr = fullCommand.permissions ? (typeof (fullCommand.permissions) === 'string' ? [fullCommand.permissions] : fullCommand.permissions) : []

                    for (const perm of permArr) {
                        if (message.author.id !== config.botOwner) {
                            if (!message.member.hasPermission(perm)) {
                                let permissionDesc = `Whoops! It seems like you can't access **${subCategory.toLowerCase()}**.`
                                await message.channel.send(new discord.MessageEmbed().setTitle(subCategoryTitle).setDescription(permissionDesc).setColor('AQUA'))
                                return
                            }
                        }
                    }

                    const mainCommand = typeof fullCommand.commands === 'string' ? fullCommand.commands : fullCommand.commands[0]
                    const args = fullCommand.expectedArgs ? ` ${fullCommand.expectedArgs}` : ''
                    const permissionString = fullCommand.permissions ? (typeof (fullCommand.permissions) === 'string' ? fullCommand.permissions : fullCommand.permissions.join(', ')) : 'None'
                    let description = fullCommand.description.replace(prefixPlaceholder, prefix)

                    let commandsString = ("`" + `${prefix}${mainCommand}` + args + "`" + ` *(permissions: ${permissionString})*` + `\n**Description:** ${description}` + "\n\n")

                    message.channel.send(new discord.MessageEmbed({
                        title: 'Command',
                        description: commandsString,
                        color: 'AQUA'
                    }))

                    return
                }
            }

            message.channel.send(`Do you need help? Use **${prefix}help**`)
            return
        }

        //#region No command section

        if (subCategory.toLowerCase() === 'info') {
            const codeBlock = "```js\n" + `const Discord = require("discord.js")\nconst bot = new Discord.Client()\n` + "```"

            await message.channel.send(new discord.MessageEmbed({
                title: 'About',
                description: "`" + `OasisBot v${config.version}` + "`" + '\n---\nCreated by **Miapolis**\nWith special thanks to **joeyzucchini**\n\nMade for **Oasis of Cubes**\n---\n' + codeBlock
            }))
            return
        }

        if (subCategory.toLowerCase() === 'documentation' || subCategory.toLowerCase() === 'docs') {
            await message.channel.send(new discord.MessageEmbed({
                title: 'Syntax Help',
                description: "`" + `${prefix}command-name` + "`" + ` *(permissions: PERMISSIONS)*` + `\n**Description:** Command description.\n\n` + "`" + '[required parameter] <optional paramater>' + "`",
                color: 'AQUA'
            }))
            return
        }

        //#endregion

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

                    if (!hasPermission && message.author.id !== config.botOwner) {
                        continue
                    }
                }

                const mainCommand = typeof command.commands === 'string' ? command.commands : command.commands[0]
                const args = command.expectedArgs ? ` ${command.expectedArgs}` : ''
                const permissionString = permissions ? permissions.join(', ') : 'None'
                let description = command.description.replace(prefixPlaceholder, prefix)

                commandsString += ("`" + `${prefix}${mainCommand}` + args + "`" + ` *(permissions: ${permissionString})*` + `\n**Description:** ${description}` + "\n\n")
            }
        }

        let permissionDesc = commandsString === '' ? `Whoops! It seems like you can't access **${subCategory.toLowerCase()}**.` : commandsString

        let catergoryEmbed = new discord.MessageEmbed().setTitle(subCategoryTitle).setDescription(permissionDesc).setColor('AQUA')

        message.channel.send(catergoryEmbed)
    }
}