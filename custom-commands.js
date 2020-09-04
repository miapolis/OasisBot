const Discord = require('discord.js')
const mongo = require('./mongo')

const { prefix } = require('./config.json')

const customCommandSchema = require('./schema/custom-command-schema')
const { commands } = require('./commands/Economy Commands/addbal')

let customCommandObject = {
    defaultResponse: 'response',
    amountOfResponses: 1,
    responses: [],
    customCommandType: 0,
    error: false
}

const commandsCache = {} //"name": obj

module.exports.getCustomCommand = async (name) => {
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
                let newCustomCommand = Object.create(customCommandObject)

                newCustomCommand.defaultResponse = result.defaultResponse
                newCustomCommand.amountOfResponses = result.amountOfResponses
                newCustomCommand.responses = result.responses
                newCustomCommand.customCommandType = result.customCommandType
                newCustomCommand.error = result.error

                commandsCache[name] = newCustomCommand

                return newCustomCommand
            } else {
                let newCustomCommand = Object.create(customCommandObject)

                newCustomCommand.error = true
                return newCustomCommand
            }
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.addCustomCommand = async (bot, name, defaultResponse, amountOfResponses, responses, customCommandType) => {
    name = name.toLowerCase()

    return await mongo().then(async (mongoose) => {
        try {
            let newCustomCommand = Object.create(customCommandObject);

            newCustomCommand.defaultResponse = defaultResponse
            newCustomCommand.amountOfResponses = amountOfResponses
            newCustomCommand.responses = responses
            newCustomCommand.customCommandType = customCommandType
            newCustomCommand.error = false

            await new customCommandSchema({
                commandName: name,
                defaultResponse,
                amountOfResponses,
                responses,
                customCommandType
            }).save()

            this.addCommandListener(bot, name)

            commandsCache[name] = newCustomCommand

            return name
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.addCommandListener = async (bot, name) => {
    console.log(`Listening for custom command ${name}`)

    bot.on('message', async message => {
        if (message.content.toLowerCase().startsWith(`${prefix}${name.toLowerCase()}`)) {
            let commandObject = await this.getCustomCommand(name)

            if (commandObject.error) { //Command was not found
                message.channel.send(new Discord.MessageEmbed({
                    title: 'That Command Does Not Exist',
                    description: "Need help finding a command? Type in " + `**${prefix}help commands** ` + `or use **${prefix}commands** ` + "to see a list of available commands",
                    color: 'RED'
                }))

                return
            }
            else {
                if (commandObject.customCommandType === 1) { //Only one response in the command
                    message.channel.send(`${commandObject.defaultResponse}`)
                    return
                }
                else if (commandObject.customCommandType === 2) { //Random custom command
                    let randomIdex = getRandomIntBetween(0, commandObject.amountOfResponses - 1)

                    message.channel.send(`${commandObject.responses[randomIdex]}`)
                    return
                }
            }
        }
    })
}

module.exports.startUp = async (bot) => {
    return await mongo().then(async (mongoose) => {
        try {
            const allCommands = await customCommandSchema.find()

            for (const command of allCommands) {
                this.addCommandListener(bot, command.commandName)

                let newCustomCommand = Object.create(customCommandObject);

                newCustomCommand.defaultResponse = command.defaultResponse
                newCustomCommand.amountOfResponses = command.amountOfResponses
                newCustomCommand.responses = command.responses
                newCustomCommand.customCommandType = command.customCommandType
                newCustomCommand.error = false

                commandsCache[command.commandName] = newCustomCommand

                console.log(`Custom command loaded ${prefix}${command.commandName}`)
            }
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.getAllInCache = () => {
    let commandArr = []
    for (const command in commandsCache) {
        commandArr.push(command)
    }
    return commandArr
}

function getRandomIntBetween(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}