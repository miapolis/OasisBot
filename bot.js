const { localToken } = require('./config.json')

const Discord = require("discord.js")
const bot = new Discord.Client()

module.exports.getClient = () => {
    return bot
}

const mongo = require('./mongo')

const loadCommands = require('./commands/load-commands')
const leveling = require('./Leveling/leveling')
const customCommands = require('./custom-commands')
const suggestions = require('./Polls/suggestions')

const IS_HOSTING = true

bot.on('ready', async () => {
    console.log(`Logged in as this bot: ${bot.user.tag}`)

    loadCommands(bot)
    leveling.startLeveling(bot)
    suggestions(bot)

    await mongo().then(mongoose => {
        try {
            console.log('Connected to MongoDB!')
        } finally {
            mongoose.connection.close()
        }
    })

    customCommands.startUp(bot)
})

if (IS_HOSTING) {
    bot.login(process.env.token)
}
else {
    bot.login(localToken)
}

bot.on('message', message => {
    // message.mentions.members.first()
    // message.author.displayAvatarURL()
    // message.guild.roles.cache.get('').nam
    // message.member.id
})
