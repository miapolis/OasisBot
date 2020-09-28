const Discord = require('discord.js')
const customCommands = require('../../custom-commands')
const botScript = require('../../bot')
const { defaultTimeout, prefix: globalPrefix } = require('../../config.json')
const reply = require('../../message-reply')
const embedColor = require('../../embed-color.json')
const commandBase = require('../command-base')
const timeHelper = require('../../time-helper')

//#region Emoji Defenitions

const creationEmojis = [
    ':regional_indicator_a:',
    ':regional_indicator_b:',
    ':regional_indicator_c:',
    '🇦',
    '🇧',
    '🇨'
]

const embedEmojis = [
    ':camera:',
    ':speech_left:',
    ':speech_balloon:',
    ':frame_photo:',
    ':small_blue_diamond:',
    ':blue_circle:',
    ':foot:',
    ':octagonal_sign:',
    ':white_check_mark:',
    '📷',
    '🗨️',
    '💬',
    '🖼️',
    '🔹',
    '🔵',
    '🦶',
    '🛑',
    '✅'
]

//#endregion

//#region Other Defenitions

const namingRegex = /^[0-9A-Za-z\-]+$/

//#endregion

module.exports = {
    commands: 'addcommand',
    description: 'Adds a new command. Will prompt for all required parameters.',
    category: 'commands',
    minArgs: 0,
    maxArgs: 0,
    permissions: 'ADMINISTRATOR',
    callback: async (message) => {
        customCommands.pushNewUserToIgnore(message.member.user.id, 'STARTED ADDCOMMAND SEQUENCE') //Start by adding the user

        let out = message.channel //message.member.user

        out.send(new Discord.MessageEmbed({
            title: 'Choose Type of Command',
            description: 'Select the type of command you would like to create.',
            color: embedColor.CORNFLOWER_BLUE
        })
            .addField(`${creationEmojis[0]} - Create a Basic Command`, 'Basic command with one response.')
            .addField(`${creationEmojis[1]} - Create a Basic Randomized Command`, 'Basic command with multiple responses chosen randomly each time.')
            .addField(`${creationEmojis[2]} - Create an Embed Command`, 'Basic command with one response, but this time with rich embed support included.')
            .setFooter('Oasis Database · New Command', botScript.getClient().user.displayAvatarURL())
        ).then(async result => {
            await result.react(creationEmojis[3])
            await result.react(creationEmojis[4])
            await result.react(creationEmojis[5])

            const filter = (reaction, user) => {
                return user.id === message.author.id
            }

            result.awaitReactions(filter, {
                max: 1,
                time: defaultTimeout
            }).then(async collected => {
                const reaction = collected.first()

                if (reaction.emoji.name === '🇦') {
                    await createBasicCommand(message, out, message.member.user)
                }
                else if (reaction.emoji.name === '🇧') {
                    await createRandomCommand(message, out, message.member.user)
                }
                else if (reaction.emoji.name === '🇨') {
                    await createEmbedCommand(message, out, message.member.user)
                }
            }).catch(collected => {
                reply.replyTimeout(message, 'Your reaction time has expired!')
                return
            })
        })
    }
}

startCommandNaming = async (message, channel, user, callback) => { //Returns command name or null for error
    const prefix = commandBase.getGuildPrefix(message.guild.id) || globalPrefix

    const responseFilter = x => x.author.id === message.author.id
    let completedNaming = false;
    let canceled = false

    let determinedName = ''

    channel.send(getNameEmbed(prefix))

    const nameCollector = channel.createMessageCollector(responseFilter, {
        time: defaultTimeout
    })

    await nameCollector.on('collect', async collectedMessage => {
        //First check if they canceled (do it before the regex test because it contains invalid characters)
        if (collectedMessage.content.toLowerCase() === '&cancel') {
            canceled = true;
            nameCollector.stop()
            return
        }

        if (!namingRegex.test(collectedMessage.content)) {
            reply.replyExclaim(collectedMessage, "Your command's name may only contain letters, numbers, and dashes.")
        }
        else {
            //Then check if the command name already exists in the database
            const commandName = collectedMessage.content
            console.log('THE COMMAND NAME IS', commandName)
            const foundCommand = await customCommands.getCustomCommand(commandName)

            if (foundCommand) {
                reply.replyExclaim(collectedMessage, `That command already exists! If you want to remove, it specify **${prefix}deletecommand**`)
                return
            }

            completedNaming = true
            determinedName = commandName

            console.log('SUCCESS', commandName)

            nameCollector.stop()
        }
    })

    await nameCollector.on('end', async collected => {
        if (canceled) {
            reply.replyExclaim(message, 'Canceled!', user)
            customCommands.removeUserToIgnore(message.member.user.id, 'CANCELED ADDCOMMAND SEQUENCE')
            return null
        }

        if (completedNaming) {
            callback(determinedName, message, channel, user)
        }
        else {
            reply.replyTimeout(message, 'Your time has expired!', user)
            customCommands.removeUserToIgnore(message.member.user.id, 'ADDCOMMAND SEQUENCE TIMEOUT')
            return null
        }
    })
}

createBasicCommand = async (message, channel, user) => {
    await startCommandNaming(message, channel, user, continueWithBasicCommand)
}

createRandomCommand = async (message, channel, user) => {
    await startCommandNaming(message, channel, user, continueWithRandomCommand)
}

createEmbedCommand = async (message, channel, user) => {
    await startCommandNaming(message, channel, user, continueWithEmbedCommand)
}

getNameEmbed = (prefix) => {
    return new Discord.MessageEmbed({
        title: 'Name Your Command',
        description: 'Give your command a name.\nOnly letters, numbers, and dashes are allowed.\nNo spaces.',
        color: embedColor.LIGHT_GREEN
    }).addField('Cancel', `Use ${prefix}cancel`)
}

//#region Post Command Steps

continueWithBasicCommand = async (commandName, message, channel, user) => {
    commandName = commandName.toLowerCase() //Make sure it's lowercase first

    const responseFilter = x => x.author.id === message.author.id

    let response = ''
    let collected = false

    let commandResponseEmbed = new Discord.MessageEmbed({
        title: 'Command Response',
        description: 'The bot will say this after you use the command. Respond below.',
        color: embedColor.STREET_BLUE
    }).addField('Cancel', 'Use &cancel')

    channel.send(commandResponseEmbed)

    const responseCollector = channel.createMessageCollector(responseFilter, { time: defaultTimeout, max: 1 })

    responseCollector.on('collect', async (collectedMessage) => {
        if (collectedMessage.content === '&cancel') {
            reply.replyExclaim('Canceled.')
            return
        }

        collected = true
        response = collectedMessage.content
    })

    responseCollector.on('end', async collected => {
        if (collected) {
            const discordMessageObj = {
                message: response,
                embed: null
            }

            await submitCustomCommand(commandName, discordMessageObj, 1, [], 1, channel, user)
            return
        }
        else {
            reply.replyTimeout(message, 'Your time has expired!', user)
            return
        }
    })
}

continueWithRandomCommand = async (commandName, message, channel, user) => {
    const prefix = commandBase.getGuildPrefix(channel.guild.id)

    await channel.send(new Discord.MessageEmbed({
        title: 'Choose Amount of Responses',
        description: 'Configure how many different responses you want your command to have. Must be an integer.',
        color: embedColor.CORNFLOWER_BLUE
    })
        .addField('Min', '2')
        .addField('Max', '50')
        .addField('Cancel', `${prefix}cancel`)
        .setFooter('Oasis Database · Random command', botScript.getClient().user.displayAvatarURL())
    )

    const filter = x => x.author.id === user.id
    const messageCollector = await channel.createMessageCollector(filter, { time: defaultTimeout })

    messageCollector.on('collect', async collected => {
        if (collected.content === `${prefix}cancel`) {
            reply.replyExclaim(message, 'Canceled!')
            messageCollector.stop()
            return
        }

        const result = Number(collected.content)

        if (!result) {
            reply.replyExclaim(message, 'Please make sure your response is an integer! Try again.')
            return
        }

        if (result > 50 || result < 2) {
            reply.replyExclaim(message, 'Keep your responses between 2 and 50! If you are going for a command with just one response, consider a **basic** command.')
            return
        }

        //Here we have a valid response
        messageCollector.stop()
        initiateResponseLoop(commandName, message, channel, user, result)
    })
}

//#region Post Command Random Steps

initiateResponseLoop = async (commandName, message, channel, user, amountOfResponses) => {
    let responses = []

    for (let i = 0; i < amountOfResponses; i++) {
        const responseNumber = i + 1

        await channel.send(new Discord.MessageEmbed({
            title: `Response Number ${responseNumber}`,
            description: `Configure response number ${responseNumber}. What will it say?`,
            color: embedColor.LIGHT_GREEN
        })
            .addField('Total Responses', amountOfResponses)
            .addField('Responses Left', amountOfResponses - responseNumber)
            .setFooter('Oasis Database · Random command', botScript.getClient().user.displayAvatarURL())
        )

        const filter = x => x.author.id === user.id

        await channel.awaitMessages(filter, { max: 1, time: defaultTimeout }).then(async collected => {
            const content = collected.first().content
            console.log('CONTENT', content)

            const msgObj = {
                message: content,
                embed: null
            }

            responses.push(msgObj)
        })
    }

    console.log(responses)
    await submitCustomCommand(commandName, '', amountOfResponses, responses, 2, channel, message.author) //(commandName, defaultResponse, amountOfResponses, responses, customCommandType, channel, humanUser)
}

//#endregion

//#region Post Command EMBED steps

continueWithEmbedCommand = async (commandName, message, channel, user) => {
    console.log('COMMAND NAME:', commandName)
    commandName = commandName.toLowerCase() //Make sure it's lowercase first

    const nonEmbedMessageFilter = x => x.author.id === message.author.id

    let response = ''
    let collected = false

    let commandResponseEmbed = new Discord.MessageEmbed({
        title: 'Message Text',
        description: 'This text is the message. This text will appear above the embed.',
        color: embedColor.STREET_BLUE
    }).addField('Cancel', 'Use &cancel').addField('Skip', 'Use &skip')

    channel.send(commandResponseEmbed)

    const responseCollector = channel.createMessageCollector(nonEmbedMessageFilter, { time: defaultTimeout, max: 1 })

    responseCollector.on('collect', async (collectedMessage) => {
        response = collectedMessage.content

        if (collectedMessage.content === '&cancel') {
            reply.replyExclaim('Canceled.')
            return
        }

        if (collectedMessage.content === '&skip') {
            response = ''
        }

        collected = true
    })

    responseCollector.on('end', async collected => {
        if (collected) {
            initiateEmbedEditor(commandName, response, message, channel, user)
            return
        }
        else {
            reply.replyTimeout(message, 'Your time has expired!', user)
            return
        }
    })
}

initiateEmbedEditor = async (commandName, nonEmbedMessage, message, channel, user) => {
    let editorEmbed = new Discord.MessageEmbed({
        title: 'Create Your Embed',
        description: 'Add a title, descriptions, fields, a footer, and more.',
        color: 'GOLD',
    }).addField('Preview Your Message', embedEmojis[0], true)
        .addField('Edit Title', embedEmojis[1], true)
        .addField('Add a Description', embedEmojis[2], true)
        .addField('Add a Thumbnail', embedEmojis[3], true)
        .addField('Add a Field', embedEmojis[4], true)
        .addField('Change Embed Color', embedEmojis[5], true)
        .addField('Add a Footer', embedEmojis[6], true)
        .addField('Cancel', embedEmojis[7], true)
        .addField('Done', embedEmojis[8], true)

    let loadingEmbed = new Discord.MessageEmbed({
        title: 'Please Wait',
        description: 'Adding all reactions...',
        color: 'GOLD'
    })

    await channel.send(loadingEmbed).then(async editorMessage => {
        for (i = 9; i <= 17; i++) {
            await editorMessage.react(embedEmojis[i])
        }

        editorMessage.edit(editorEmbed)

        let embedRawTextMessage = { v: nonEmbedMessage }
        let title = { v: '' }
        let description = { v: '' }
        let thumbnail = { v: '' }
        let fields = { v: [] }
        let embedHexColor = { v: '' }
        let footer = {
            v: {
                text: '',
                iconURL: ''
            }
        }

        const filter = (reaction, user) => {
            return true
        }

        const reactionCollector = editorMessage.createReactionCollector(filter, { time: 600000 })

        reactionCollector.on('collect', async reaction => {
            const userId = message.member.user.id

            const userReactions = editorMessage.reactions.cache.filter(reaction => reaction.users.cache.has(userId));
            try {
                for (const reaction of userReactions.values()) {
                    await reaction.users.remove(userId);
                }
            } catch (error) {
                console.error('Failed to remove reactions.');
            }

            switch (reaction.emoji.name) {
                case '📷':
                    previewEmbed(channel, embedRawTextMessage, title, description, thumbnail, fields, embedHexColor, footer.v.text, footer.v.iconURL)
                    break
                case '🗨️':
                    modifyOneStepProperty(message, channel, title, new Discord.MessageEmbed({
                        title: 'Give Your Embed a Title',
                        description: `^ That's a title ^`,
                        color: embedColor.LIGHT_GREEN
                    }))
                    break
                case '💬':
                    modifyOneStepProperty(message, channel, description, new Discord.MessageEmbed({
                        title: 'Give Your Embed a Description',
                        description: `**This** is a description.`,
                        color: embedColor.LIGHT_GREEN
                    }))
                    break
                case '🖼️':
                    modifyOneStepProperty(message, channel, thumbnail, new Discord.MessageEmbed({
                        title: 'Give Your Embed a Thumbnail',
                        description: `These should be a link.`,
                        color: embedColor.LIGHT_GREEN
                    }).setThumbnail('https://media.discordapp.net/attachments/711578504667332609/757233673354608691/EXAMPLE.png?width=684&height=684'))
                    break
                case '🔹':
                    modifyFieldProperty(message, channel, fields, new Discord.MessageEmbed({
                        title: 'Add Fields to Your Embed',
                        description: `Here's what some fields look like.`
                    }).addField('This is a field name', 'This is a field value', false)
                        .addField('This field is inline', 'Inline', true)
                        .addField('This field is not inline', 'Not inline'))
                    break
                case '🔵':
                    modifyOneStepProperty(message, channel, embedHexColor, new Discord.MessageEmbed({
                        title: 'Change the Color of Your Embed',
                        description: 'Input hex color format. You can use a color picker like this one [here](https://www.google.com/search?&q=hex+color+picker).',
                        color: embedColor.STREET_BLUE
                    }))
                    break
                case '🦶':
                    modifyFooterProperty(message, channel, footer, new Discord.MessageEmbed({
                        title: 'Give your Embed a Footer',
                        description: 'Footers are a really great way to top off your embeds!',
                        color: embedColor.LIGHT_GREEN
                    }).setFooter('THIS is a footer.', message.author.displayAvatarURL()))
                    break
                case '🛑':
                    break
                case '✅':
                    const submitEmbed = new Discord.MessageEmbed({
                        title: title.v,
                        description: description.v,
                        fields: fields.v,
                        color: embedHexColor.v
                    }).setThumbnail(thumbnail.v).setFooter(footer.v.text, footer.v.iconURL)

                    submitEmbed.thumbnail

                    submitCustomCommand(commandName, { message: nonEmbedMessage, embed: submitEmbed }, 1, [], 3, channel, user) //async (commandName, defaultResponse, amountOfResponses, responses, customCommandType, channel, user) => {
                    reactionCollector.stop()

                    break
            }
        })
    })
}

modifyOneStepProperty = async (originalMessage, channel, propertyObject, informationEmbed) => {
    const botMessage = await channel.send(informationEmbed)

    const filter = (message) => message.member.user.id === originalMessage.member.user.id

    const messageCollector = channel.createMessageCollector(filter, { max: 1, timeout: defaultTimeout })

    messageCollector.on('collect', async (collectedMessage) => {
        const response = collectedMessage.content

        propertyObject.v = response

        collectedMessage.log = false
        botMessage.log = false

        await collectedMessage.delete()
        await botMessage.delete()
    })
}

modifyFieldProperty = async (originalMessage, channel, propertyObject, informationEmbed) => { //Information embed contains info about how fields look
    let fieldObj = {
        name: '',
        value: '',
        inline: false
    }

    let messagesToBeDeleted = []

    const embedMessage = await channel.send(informationEmbed)
    messagesToBeDeleted.push(embedMessage)

    const addFieldNameEmbed = new Discord.MessageEmbed({
        title: 'Give Your new Field a Name',
        description: 'This shows up as the bold, upper part of the field.',
        color: embedColor.LIGHT_GREEN
    })

    const addFieldNameMessage = await channel.send(addFieldNameEmbed)
    messagesToBeDeleted.push(addFieldNameMessage)

    const filter = (message) => message.member.user.id === originalMessage.member.user.id

    let currentStep = 1 //1: name, 2: value, 3: inline

    const messageCollector = channel.createMessageCollector(filter, { max: 3, timeout: defaultTimeout })

    messageCollector.on('collect', async (collectedMessage) => {
        messagesToBeDeleted.push(collectedMessage)
        const response = collectedMessage.content

        if (currentStep === 1) {
            fieldObj.name = response

            valueEmbedMessage = await channel.send(new Discord.MessageEmbed({
                title: 'Give Your new Field a Value',
                description: 'This shows up as the regular, lower part of the field.',
                color: embedColor.LIGHT_GREEN
            }))
            messagesToBeDeleted.push(valueEmbedMessage)
            currentStep++
        }
        else if (currentStep === 2) {
            fieldObj.value = response

            inlineFieldMessage = await channel.send(new Discord.MessageEmbed({
                title: 'Do You Want Your Field to be Inline?',
                description: 'These determines whether or not fields will be stacked vertically or will be arranged in a grid layout. Default is false, resulting in vertical stacking.\n\nReply with **y/yes** || **n/no**',
                color: embedColor.LIGHT_GREEN
            }))
            messagesToBeDeleted.push(inlineFieldMessage)
            currentStep++
        }
        else if (currentStep === 3) {
            let value = false

            switch (response.toLowerCase()) {
                case 'y':
                    value = true
                    break
                case 'yes':
                    value = true
                    break
                case 'n':
                    value = false
                    break
                case 'no':
                    value = false
                    break
                default:
                    value = false
            }

            fieldObj.inline = value

            for (const message of messagesToBeDeleted) {
                setTimeout(async () => {
                    message.log = false
                    await message.delete()
                }, 700)
            }

            propertyObject.v.push(fieldObj)
        }
    })
}

modifyFooterProperty = async (originalMessage, channel, propertyObject, informationEmbed) => { //Information embed contains info about how fields look
    const prefix = commandBase.getGuildPrefix(originalMessage.guild.id) || globalPrefix

    let footerObj = {
        text: '',
        iconURL: ''
    }

    let messagesToBeDeleted = []
    let currentStep = 1; //1 text, 2 icon

    const filter = (message) => message.member.user.id === originalMessage.member.user.id

    const originalEmbedMessage = await channel.send(informationEmbed)
    messagesToBeDeleted.push(originalEmbedMessage)

    const addFooterTextEmbed = await channel.send(new Discord.MessageEmbed({
        title: 'Give Your Footer Text',
        description: 'Icon will be added later',
        color: embedColor.LIGHT_GREEN
    }).setFooter('This is footer text.'))
    messagesToBeDeleted.push(addFooterTextEmbed)

    const messageCollector = channel.createMessageCollector(filter, { max: 2, timeout: defaultTimeout })

    messageCollector.on('collect', async (collectedMessage) => {
        messagesToBeDeleted.push(collectedMessage)
        const response = collectedMessage.content

        if (currentStep === 1) {
            footerObj.text = response

            let addIconEmbed = await channel.send(new Discord.MessageEmbed({
                title: 'Add an Icon to Your Footer',
                color: embedColor.LIGHT_GREEN
            }).addField('Skip', `${prefix}skip`).setFooter('<--', originalMessage.author.displayAvatarURL()))
            messagesToBeDeleted.push(addIconEmbed)

            currentStep++
        }
        else if (currentStep === 2) {
            if (response === `${prefix}skip`) {
                footerObj.iconURL = ''
            }
            else {
                footerObj.iconURL = response
            }

            for (const message of messagesToBeDeleted) {
                setTimeout(async () => {
                    message.log = false
                    await message.delete()
                }, 700)
            }

            propertyObject.v = footerObj
            return
        }
    })
}

previewEmbed = (channel, rawText, title, description, thumbnail, fields, embedHexColor, footerText, footerIcon) => {
    channel.send(rawText.v, new Discord.MessageEmbed({
        title: title.v,
        description: description.v,
        fields: fields.v,
        color: embedHexColor.v,
    }).setThumbnail(thumbnail.v).setFooter(footerText, footerIcon)).then(sent => {
        setTimeout(() => {
            sent.log = false
            sent.delete()
        }, 5000)
    })
}

//#endregion

submitCustomCommand = async (commandName, defaultResponse, amountOfResponses, responses, customCommandType, channel, humanUser) => {
    channel.send(new Discord.MessageEmbed({
        title: 'Loading...',
        description: 'Hang on.',
        color: embedColor.CORNFLOWER_BLUE
    }).setFooter('Oasis Database · Creating Command', botScript.getClient().user.displayAvatarURL()))

    await customCommands.addCustomCommand(commandName, defaultResponse, amountOfResponses, responses, customCommandType)

    setTimeout(() => {
        channel.send(new Discord.MessageEmbed({
            title: 'Command Created',
            description: `Your new command, ${commandName}, has been successfully created.`,
            color: embedColor.SUCCESS_GREEN
        }).setFooter(`Oasis Database · Modified at ${timeHelper.getFormattedMilitaryTime()}`, botScript.getClient().user.displayAvatarURL()))

        customCommands.removeUserToIgnore(humanUser.id, 'SUCCESS CUSTOM COMMAND ADDED')
    }, 2000)
}

//#endregion