const { localToken } = require('./config.json')

const Discord = require("discord.js")
const bot = new Discord.Client()

module.exports.getClient = () => { return bot }
module.exports.updateAcvitivty = async (prefix) => await bot.user.setActivity(`${prefix}help`)

const mongo = require('./mongo')

const loadCommands = require('./commands/load-commands')
const leveling = require('./Leveling/leveling')
const customCommands = require('./custom-commands')
const commandBase = require('./commands/command-base')
const messageDeleteLog = require('./message-delete-log')
const messagePin = require('./message-pin')
const polls = require('./Polls/polling-system')

const IS_HOSTING = false

bot.on('ready', async () => {
    console.log(`Logged in as this bot: ${bot.user.tag}`)

    loadCommands(bot) //First load all of the commands in

    await commandBase.loadPrefixes(bot) //Then load the prefixes
    await customCommands.startup(bot) //Then load in the custom commands

    await leveling.startLeveling(bot) //Start other processes like leveling

    await messagePin.startup(bot) //Misc. like message pinning

    await polls.startup(bot)

    messageDeleteLog.start(bot)

    this.updateAcvitivty('&')
})

if (IS_HOSTING) {
    bot.login(process.env.token)
}
else {
    bot.login(localToken)
}

