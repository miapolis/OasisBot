const Discord = require('discord.js')

const pollDatabase = require('./poll-database')
const pollSchema = require('../schema/poll-schema')
const incognitoPollSchema = require('../schema/incognito-poll-schema')
const mongo = require('../mongo')

const interval = 3600000 //Change to 3600000

const runningPolls = {}
//'pollId' : {pollMessage, originalContent, endTime(unix timestamp)}
const runningIncognitoPolls = {}
//'pollId' : {pollMessage, originalContent, endTime(unix timestamp), reactions[{reactionName, users}], participants}

const embedColor = require('../embed-color.json')
const reply = require('../message-reply')
const commandBase = require('../commands/command-base')
const { collection } = require('../schema/poll-schema')

module.exports.startup = async (bot) => {
    await mongo().then(async mongoose => {
        try {
            //#region Regular polls

            const allPolls = await pollSchema.find()

            for (const poll of allPolls) {
                const pollChannel = await bot.channels.cache.get(poll.channelId)

                if (!pollChannel) { return }

                const pollMessage = await pollChannel.messages.fetch(poll._id)

                runningPolls[poll._id] = {
                    pollMessage,
                    originalContent: pollMessage.embeds[0].description,
                    endTime: poll.endTime
                }
            }

            //#endregion

            const allIPolls = await incognitoPollSchema.find()

            for (const poll of allIPolls) {
                const pollChannel = await bot.channels.cache.get(poll.channelId)

                if (!pollChannel) { return }

                const pollMessage = await pollChannel.messages.fetch(poll._id)

                runningIncognitoPolls[poll._id] = {
                    pollMessage,
                    originalContent: pollMessage.embeds[0].description,
                    setReactions: poll.setReactions,
                    endTime: poll.endTime,
                    participants: poll.participants,
                    reactions: poll.reactions
                }

                const now = new Date
                const calculatedMs = (poll.endTime - now.getTime() / 1000) * 1000

                if (calculatedMs <= 0) {
                    continue
                }

                //#region Check Extra Reactions
                pollMessage.reactions.cache.forEach(async reaction => {
                    console.log(reaction.users.cache.find())
                    for (const user of await reaction.users.fetch()) {
                        if (!poll.participants.includes(user[1].id) && user[1].id !== bot.user.id) {
                            //Try/Catch because the bot also reacted (can't DM itself)
                            this.dmUserPoll(user[1], poll.setReactions, runningIncognitoPolls[poll._id])
                        }
                    }
                })
                //#endregion

                const rc = await pollMessage.createReactionCollector(x => true === true, { time: calculatedMs })

                rc.on('collect', async (reaction, user) => { //Use cache so we don't have to do a database read every single time
                    const found = runningIncognitoPolls[pollMessage.id]

                    if (!found) { return }

                    if (found.participants.includes(user.id)) {
                        console.log('User already participated.')
                        return
                    }

                    this.dmUserPoll(await user.fetch(), poll.setReactions, runningIncognitoPolls[poll._id])
                })
            }
        } finally {
            mongoose.connection.close()
        }
    })

    processUpdates() //Just check to ensure it doesn't happen 1 hour after the bot went online
    setInterval(processUpdates, interval)
}

module.exports.addPoll = async (message, channel, reactions, originalContent, duration) => {
    const endTime = this.getEndTimestamp(duration)

    const pollMessage = await channel.send(new Discord.MessageEmbed({
        title: 'Poll',
        description: originalContent,
        color: embedColor.STREET_BLUE
    })
        .setFooter(`Ends at • ${this.calculateDateByUnixTimestamp(endTime)}`, message.author.displayAvatarURL())
    )

    for (const reaction of reactions) {
        await pollMessage.react(getReaction(reaction))
    }

    const pollObj = {
        pollMessage,
        originalContent,
        endTime
    }
    runningPolls[pollMessage.id] = pollObj

    pollDatabase.addPoll(pollMessage.id, pollMessage.channel.id, endTime)
}

module.exports.addIncognitoPoll = async (message, channel, reactions, enterEmoji, originalContent, duration) => {
    const endTime = this.getEndTimestamp(duration)
    const msDuration = this.getEndTimestamp(duration, true)

    const pollMessage = await channel.send(new Discord.MessageEmbed({
        title: 'Incognito Poll',
        description: originalContent,
        color: embedColor.STREET_BLUE
    })
        .addField('Enter', `React with ${enterEmoji} to privately submit your response.`)
        .setFooter(`Ends at • ${this.calculateDateByUnixTimestamp(endTime)}`, message.author.displayAvatarURL())
    )

    const incognitoPollObj = {
        pollMessage,
        originalContent,
        setReactions: reactions,
        endTime,
        reactions: [],
        participants: []
    }
    //Add to the cache

    runningIncognitoPolls[pollMessage.id] = incognitoPollObj

    await pollDatabase.addIncognitoPoll(pollMessage.id, pollMessage.channel.id, reactions, endTime)

    //Set up listener

    const rc = await pollMessage.createReactionCollector(x => true === true, { time: msDuration })

    await pollMessage.react(getReaction(enterEmoji)) //Add the reaction last to ensure no one reacts too early and it breaks

    rc.on('collect', async (reaction, user) => { //Use cache so we don't have to do a database read every single time
        const found = runningIncognitoPolls[pollMessage.id]

        if (!found) { return }

        if (found.participants.includes(user.id)) {
            console.log('User already participated.')
            return
        }

        this.dmUserPoll(await user.fetch(), reactions, incognitoPollObj)
    })
}

module.exports.dmUserPoll = async (user, reactions, pollObj) => {
    try {
        var dmdPollMessage = await user.send(new Discord.MessageEmbed({
            title: 'Poll',
            description: pollObj.originalContent,
            footer: {
                text: 'Incognito poll. Your response is private.'
            },
            color: embedColor.STREET_BLUE
        }))
    }
    catch (e) {
        console.log('Failed to send user message.')
        return
    }

    for (const reaction of reactions) {
        await dmdPollMessage.react(getReaction(reaction))
    }

    await dmdPollMessage.awaitReactions(x => reactions.includes(speakReaction(x)), { max: 1, time: 600000 }).then(async collected => {
        const reaction = collected.first()

        //Do cache first
        const found = runningIncognitoPolls[pollObj.pollMessage.id]
        found.participants.push(user.id)
        found.reactions.push(speakReaction(reaction))
        //Then db
        await pollDatabase.incognitoReactionAdded(pollObj.pollMessage.id, speakReaction(reaction), user)

        user.send('Thank you for your response!')
    })
}

processUpdates = async () => {
    const date = new Date;
    const now = Math.round(date.getTime() / 1000)
    console.log('Polling cycle', now)

    let deletetionIndexes = []
    let iDeletionIndexes = []

    for (const poll in runningPolls) {
        const value = runningPolls[poll]

        if (now >= value.endTime) { // The poll has ended
            console.log('POLL ENDED!')

            this.calculateResultsAndFinish(value.pollMessage, value.pollMessage)

            deletetionIndexes.push(poll)
        }
    }

    for (const poll in runningIncognitoPolls) {
        const value = runningIncognitoPolls[poll]

        if (now >= value.endTime) { // The poll has ended
            console.log('POLL ENDED!')

            this.calculateIncognitoResults(value.pollMessage)

            iDeletionIndexes.push(poll)
        }
    }

    for (const index of deletetionIndexes) {
        delete runningPolls[index]
        await pollDatabase.clearPoll(index)
    }

    for (const index of iDeletionIndexes) {
        delete runningIncognitoPolls[index]
        await pollDatabase.clearIncognitoPoll(index)
    }
}

module.exports.endPollEarly = async (message, pollId) => {
    const value = runningPolls[pollId] || runningIncognitoPolls[pollId]

    if (!value) {
        const prefix = commandBase.getGuildPrefix(message.guild.id)
        reply.replyExclaim(message, `That poll doesn't seem to exist! If you need to find your poll, use **${prefix}viewpolls** and enter the ID highlighted in blue.`)
        return
    }

    console.log('POLL ENDED EARLY')

    if (runningPolls[pollId]) {
        this.calculateResultsAndFinish(value.pollMessage, value.pollMessage)
        delete runningPolls[pollId]
        await pollDatabase.clearPoll(pollId)
    }
    else {
        this.calculateIncognitoResults(value.pollMessage)
        delete runningIncognitoPolls[pollId]
        await pollDatabase.clearIncognitoPoll(pollId)
    }
}

module.exports.cancelPoll = async (message, pollId) => {
    const value = runningPolls[pollId] || runningIncognitoPolls[pollId]

    if (!value) {
        const prefix = commandBase.getGuildPrefix(message.guild.id)
        reply.replyExclaim(message, `That poll doesn't seem to exist! If you need to find your poll, use **${prefix}viewpolls** and enter the ID highlighted in blue.`)
        return
    }

    console.log('POLL CANCELED')

    await value.pollMessage.delete()

    if (runningPolls[pollId]) {
        delete runningPolls[pollId]
        await pollDatabase.clearPoll(pollId)
    }
    else {
        delete runningIncognitoPolls[pollId]
        await pollDatabase.clearIncognitoPoll(pollId)
    }
}

module.exports.calculateResultsAndFinish = async (pollMessage, content) => {
    let resultsString = ''

    pollMessage.reactions.cache.forEach(reaction => {
        resultsString += (`${speakReaction(reaction)} = **${reaction.count - 1}** ${(reaction.count - 1 === 1 ? 'member' : 'members')}\n`)
    })

    pollMessage.channel.send(new Discord.MessageEmbed({
        title: 'Poll Results',
        description: resultsString + `\nView the [poll](https://discordapp.com/channels/${pollMessage.guild.id}/${pollMessage.channel.id}/${pollMessage.id})`,
        color: embedColor.LIGHT_GREEN
    }))

    const e = pollMessage.embeds[0]
    pollMessage.edit(new Discord.MessageEmbed({
        title: 'Poll [ENDED]',
        description: e.description,
        color: embedColor.WARM_RED,
        footer: {
            text: e.footer.text + ' (ended)',
            iconURL: e.footer.iconURL
        }
    }))
}

module.exports.calculateIncognitoResults = async (pollMessage) => {
    let distinctArr, emojiArr = []

    const foundInCache = runningIncognitoPolls[pollMessage.id]

    if (!foundInCache) { return }

    distinctArr = foundInCache.reactions.filter(onlyUnique)

    for (const unique of distinctArr) {
        emojiArr[unique] = foundInCache.reactions.filter((v) => (v === unique)).length
    }

    let resultsString = ''
    for (const num in emojiArr) {
        resultsString += (`${num} = **${emojiArr[num]}** ${(emojiArr[num] === 1 ? 'member' : 'members')}\n`)
    }

    if (distinctArr.length < foundInCache.setReactions.length) { //If all of the reactions weren't used
        const noIncludeArr = foundInCache.setReactions.filter(x => !distinctArr.includes(x))

        for (const emoji of noIncludeArr) {
            resultsString += (`${emoji} = **0** members\n`)
        }
    }

    pollMessage.channel.send(new Discord.MessageEmbed({
        title: 'Poll Results',
        description: resultsString + `\nView the [poll](https://discordapp.com/channels/${pollMessage.guild.id}/${pollMessage.channel.id}/${pollMessage.id})`,
        color: embedColor.LIGHT_GREEN
    }))

    const e = pollMessage.embeds[0]
    pollMessage.edit(new Discord.MessageEmbed({
        title: 'Poll [ENDED]',
        description: e.description,
        color: embedColor.WARM_RED,
        fields: e.fields,
        footer: {
            text: e.footer.text + ' (ended)',
            iconURL: e.footer.iconURL
        }
    }))
}

module.exports.getEndTimestamp = (durationString, getMill = false) => { // Takes in input like 3d, 20s, 24h, etc.
    const validCharacters = ['s', 'm', 'h', 'd', 'w'] // Shake my head don't wink ;)
    const numberRegex = /^\d+$/

    for (let i = 0; i < validCharacters.length; i++) {
        if (durationString.includes(validCharacters[i])) {
            break
        }
        else if (i === validCharacters.length - 1) {
            console.log('Invalid characters specified!')
            return 'Invalid characters specified!'
        }
    }

    const unitChar = durationString.slice(-1)
    const valueString = durationString.substring(0, durationString.length - 1)

    console.log(unitChar)
    console.log(valueString)

    if (!numberRegex.test(valueString)) {
        console.log('Invalid format specified!')
        return 'Invalid format specified!'
    }

    const value = Number(valueString)

    const date = new Date
    const now = Math.round(date.getTime() / 1000)

    if (!getMill) {
        switch (unitChar) {
            case 's':
                return now + value
            case 'm':
                return now + (value * 60)
            case 'h':
                return now + (value * 3600)
            case 'd':
                return now + (value * 86400)
            case 'w':
                return now + (value * 604800)
        } //No default case because we did the invalid character test in the beginning
    }
    else {
        switch (unitChar) {
            case 's':
                return value * 1000
            case 'm':
                return value * 60 * 1000
            case 'h':
                return value * 3600 * 1000
            case 'd':
                return value * 86400 * 1000
            case 'w':
                return now * 6048 * 1000
        } //No default case because we did the invalid character test in the beginning
    }

}

module.exports.getAllInCache = () => { return [runningPolls, runningIncognitoPolls] }

module.exports.calculateDateByUnixTimestamp = (unixTimestamp) => {
    let date = new Date(unixTimestamp * 1000)

    const month = date.getMonth()
    const day = date.getDate()
    const hourValue = date.getHours() > 12 ? (date.getHours() - 12) : date.getHours()
    const ampm = date.getHours() === 24 ? 'AM' : date.getHours() < 12 ? 'AM' : 'PM'
    const minutes = date.getMinutes()

    const sminutes = minutes < 10 ? '0' + minutes : minutes

    return `${month}/${day} - ${hourValue}:${sminutes} ${ampm}`
}

getReaction = (emoji) => {
    if (!emoji.includes('<')) {
        return emoji
    }
    const indexOfLastColon = emoji.lastIndexOf(':') + 1
    return emoji.slice(indexOfLastColon, emoji.length - 1)
}

speakReaction = (reaction) => {
    return reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name
}

onlyUnique = (value, index, self) => {
    return self.indexOf(value) === index
}