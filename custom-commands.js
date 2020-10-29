const Discord = require('discord.js')
const mongo = require('./mongo')

const customCommandSchema = require('./schema/custom-command-schema.js')
const loadCommands = require('./commands/load-commands')
const commandBase = require('./commands/command-base')
const reply = require('./message-reply')

const commandsCache = {} //"name": obj

let ignoredUsers = [] //Just an array of IDs

module.exports.getIgnoredUsers = () => {
    return ignoredUsers
}

module.exports.getCustomCommand = async (name) => {
    console.log('RUNNING...')

    name = name.toLowerCase()

    const cachedValue = commandsCache[name]

    if (cachedValue) { return cachedValue }

    return await mongo().then(async (mongoose) => {
        try {
            console.log('Running findOne()')

            const result = await customCommandSchema.findOne({
                commandName: name
            })

            console.log('RESULT: ', result)

            if (result) {
                commandsCache[name] = result

                console.log('RSULT FROM GET:', result)

                return result
            } else {
                return false
            }
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.addCustomCommand = async (name, defaultResponse, aor, responses, customCommandType, channelIds) => { //Add message with embed object
    name = name.toLowerCase()

    const embed = defaultResponse.embed

    return await mongo().then(async (mongoose) => {
        try {
            const addedDoc = await new customCommandSchema({
                commandName: name,
                defaultResponse: {
                    message: defaultResponse.message,
                    embed: embed ? {
                        title: embed.title,
                        description: embed.description,
                        hexColor: embed.color,
                        thumbnailURL: embed.thumbnail.url,
                        fields: embed.fields,
                        footer: {
                            text: embed.footer ? embed.footer.text : '',
                            iconURL: embed.footer ? embed.footer.iconURL : ''
                        }
                    } : undefined
                },
                amountOfResponses: aor,
                responses,
                customCommandType,
                invalidChannelIds: channelIds[0],
                validChannelIds: channelIds[1]
            }).save()

            commandsCache[name] = addedDoc
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.editCustomCommand = async (originalName, name, defaultResponse, amountOfResponses, responses, channelIds) => {
    originalName = originalName.toLowerCase()
    name = name.toLowerCase()

    const embed = defaultResponse ? defaultResponse.embed : null

    return await mongo().then(async (mongoose) => {
        try {
            const newDoc = await customCommandSchema.findOneAndUpdate({
                commandName: originalName
            },
                {
                    commandName: name,
                    defaultResponse: {
                        message: defaultResponse ? defaultResponse.message : '',
                        embed: embed ? {
                            title: embed.title,
                            description: embed.description,
                            hexColor: embed.color,
                            thumbnailURL: embed.thumbnail.url,
                            fields: embed.fields,
                            footer: {
                                text: embed.footer ? embed.footer.text : '',
                                iconURL: embed.footer ? embed.footer.iconURL : ''
                            }
                        } : undefined
                    },
                    amountOfResponses,
                    responses,
                    invalidChannelIds: channelIds ? channelIds[0] : [],
                    validChannelIds: channelIds ? channelIds[1] : []
                },
                {
                    upsert: true,
                    useFindAndModify: false,
                    new: true
                }
            )

            delete commandsCache[originalName]
            commandsCache[name] = newDoc
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.deleteCustomCommand = async (name) => {
    name = name.toLowerCase()

    return await mongo().then(async (mongoose) => {
        try {
            console.log('Running deleteOne()')

            await customCommandSchema.deleteOne({
                commandName: name
            }).then(() => {
                console.log('Object deleted.')

                if (commandsCache[name]) {
                    delete commandsCache[name]
                }
            }).catch(error => {
                console.log(error)
            })
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.startup = async (bot) => {
    return await mongo().then(async (mongoose) => {
        try {
            const allCommands = await customCommandSchema.find()

            for (const command of allCommands) {
                commandsCache[command.commandName] = command

                console.log(`Custom command loaded &${command.commandName}`) //Use default prefix since this shows up in the global config
            }

            this.startListener(bot)
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.startListener = async (bot) => {
    const defaultCommands = loadCommands()

    let commandNamesArray = []

    for (const commandOption of defaultCommands) {
        if (typeof (commandOption.commands) === 'string') {
            commandNamesArray.push(commandOption.commands)
        }
        else {
            for (const alias of commandOption.commands) {
                commandNamesArray.push(alias)
            }
        }
    }

    console.log('ALL COMMANDS', commandNamesArray)

    bot.on('message', async message => {
        if (!message.member) { return } //NO DMs!
        if (ignoredUsers.includes(message.member.user.id)) { return } //Very simple
        if (message.member.user.bot) { return }

        const prefix = getPrefix(message.guild.id)

        const newContent = message.content
        const arguments = newContent.split(/[ ]+/)

        if (arguments.length > 1) { return }

        if (newContent.toLowerCase().startsWith(`${prefix}`)) {
            let cmdString = newContent.substring(1)

            if (commandNamesArray.includes(cmdString)) { return }

            let commandObject = await this.getCustomCommand(cmdString)

            if (!commandObject) { //Command was not found
                message.channel.send(new Discord.MessageEmbed({
                    title: 'That Command Does Not Exist',
                    description: "Need help? Type in " + `**${prefix}help**\n` + `Looking for a custom command? Use **${prefix}help commands** or **${prefix}commands**`,
                    color: 'RED'
                }))

                return
            }

            if (commandObject.invalidChannelIds && commandObject.invalidChannelIds.length !== 0) { //We have channels that are invalid and the mode is set to invalid channels
                if (commandObject.invalidChannelIds.includes(message.channel.id)) { //Sent in an invalid channel
                    reply.replyExclaim(message, 'That command is disabled in this channel.')
                    return
                }
            }
            else if (commandObject.validChannelIds && commandObject.validChannelIds.length !== 0) { //We only have a limited amount of valid channels and the mode is valid channels
                if (!(commandObject.validChannelIds.includes(message.channel.id))) {  //The channel we are in isn't a valid one 
                    reply.replyExclaim(message, 'That command is disabled in this channel.')
                    return
                }
            }

            if (commandObject.customCommandType === 1) { //Only one response in the command
                message.channel.send(`${commandObject.defaultResponse.message}`)
                return
            }
            else if (commandObject.customCommandType === 2) { //Random custom command
                let randomIdex = getRandomIntBetween(0, commandObject.amountOfResponses - 1)

                message.channel.send(`${commandObject.responses[randomIdex].message}`)
                return
            }
            else if (commandObject.customCommandType === 3) { //Single embed command 
                const commandText = commandObject.defaultResponse.message

                const d = commandObject.defaultResponse.embed
                const color = d.hexColor ? '#' + ((Number)(d.hexColor)).toString(16) : undefined

                let embed = new Discord.MessageEmbed({
                    title: d.title,
                    description: d.description ? d.description : undefined,
                    color: color ? color : undefined,
                    fields: d.fields ? d.fields : undefined
                })

                if (d.thumbnailURL) {
                    embed.setThumbnail(d.thumbnailURL)
                }

                if (d.footer.text) {
                    embed.setFooter(d.footer.text, d.footer.iconURL)
                }

                message.channel.send(commandText, embed)
                return
            }
        }
    })
}

module.exports.pushNewUserToIgnore = (id, reason) => {
    console.log(`USER WITH ID ${id} IGNORED:`)
    ignoredUsers.push(id)
}

module.exports.removeUserToIgnore = (id, reason) => {
    const index = ignoredUsers.indexOf(id)
    if (index > -1) { ignoredUsers.splice(index, 1) }
    console.log(`USER WITH ID ${id} REMOVED FROM IGNORED:`, reason)

}

module.exports.getAllInCache = () => {
    let commandArr = []
    for (const command in commandsCache) {
        commandArr.push(command)
    }
    return commandArr
}

getPrefix = (guildId) => {
    return commandBase.getGuildPrefix(guildId)
}

getRandomIntBetween = (min, max) => {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}