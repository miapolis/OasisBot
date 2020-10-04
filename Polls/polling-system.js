const Discord = require('discord.js')

const pollDatabase = require('./poll-database')
const pollSchema = require('../schema/poll-schema')
const mongo = require('../mongo')

const interval = 3600000 //Change to 3600000

const runningPolls = {}
//'pollId' : {pollMessage, originalContent, endTime(unix timestamp)}

const embedColor = require('../embed-color.json')
const reply = require('../message-reply')
const commandBase = require('../commands/command-base')

module.exports.startup = async (bot) => {
    await mongo().then(async mongoose => {
        try {
            const allPolls = await pollSchema.find()

            for (const poll of allPolls) {
                const pollMessage = await bot.channels.cache.get(poll.channelId).messages.fetch(poll._id)

                runningPolls[poll._id] = {
                    pollMessage,
                    originalContent: pollMessage.embeds[0].description,
                    endTime: poll.endTime
                }
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
        await pollMessage.react(reaction)
    }

    const pollObj = {
        pollMessage,
        originalContent,
        endTime
    }
    runningPolls[pollMessage.id] = pollObj

    pollDatabase.addPoll(pollMessage.id, pollMessage.channel.id, endTime)
}

processUpdates = async () => {
    const date = new Date;
    const now = Math.round(date.getTime() / 1000)
    console.log('Polling cycle', now)

    let deletetionIndexes = []

    for (const poll in runningPolls) {
        const value = runningPolls[poll]

        if (now >= value.endTime) { // The poll has ended
            console.log('POLL ENDED!')

            this.calculateResultsAndFinish(value.pollMessage, value.pollMessage)

            deletetionIndexes.push(poll)
        }
    }

    for (const index of deletetionIndexes) {
        delete runningPolls[index]
        await pollDatabase.clearPoll(index)
    }
}

module.exports.endPollEarly = async (message, pollId) => {
    const value = runningPolls[pollId]

    if (!value) {
        const prefix = commandBase.getGuildPrefix(message.guild.id)
        reply.replyExclaim(message, `That poll doesn't seem to exist! If you need to find your poll, use **${prefix}viewpolls** and enter the ID highlighted in blue.`)
        return
    }

    console.log('POLL ENDED EARLY')

    this.calculateResultsAndFinish(value.pollMessage, value.pollMessage)

    delete runningPolls[pollId]
    await pollDatabase.clearPoll(pollId)
}

module.exports.calculateResultsAndFinish = async (pollMessage, content) => {
    let resultsString = ''

    pollMessage.reactions.cache.forEach(reaction => {
        resultsString += (`${reaction.emoji.name} = **${reaction.count - 1}** ${(reaction.count - 1 === 1 ? 'member' : 'members')}\n`)
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

module.exports.getEndTimestamp = (durationString) => { // Takes in input like 3d, 20s, 24h, etc.
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

    const date = new Date;
    const now = Math.round(date.getTime() / 1000)

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

module.exports.getAllInCache = () => { return runningPolls }

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