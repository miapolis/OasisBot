const { prefix: globalPrefix } = require('../config.json')
const guildPrefixes = {} // { 'guildId' : 'prefix' }

const mongo = require('../mongo')
const guildConfigSchema = require('../schema/guild-config')

const Discord = require('discord.js')
const reply = require('../message-reply')
const customCommands = require('../custom-commands')

const validatePermissions = (permissions) => {
    const validPermissions = [
        'CREATE_INSTANT_INVITE',
        'KICK_MEMBERS',
        'BAN_MEMBERS',
        'ADMINISTRATOR',
        'MANAGE_CHANNELS',
        'MANAGE_GUILD',
        'ADD_REACTIONS',
        'VIEW_AUDIT_LOG',
        'PRIORITY_SPEAKER',
        'STREAM',
        'VIEW_CHANNEL',
        'SEND_MESSAGES',
        'SEND_TTS_MESSAGES',
        'MANAGE_MESSAGES',
        'EMBED_LINKS',
        'ATTACH_FILES',
        'READ_MESSAGE_HISTORY',
        'MENTION_EVERYONE',
        'USE_EXTERNAL_EMOJIS',
        'VIEW_GUILD_INSIGHTS',
        'CONNECT',
        'SPEAK',
        'MUTE_MEMBERS',
        'DEAFEN_MEMBERS',
        'MOVE_MEMBERS',
        'USE_VAD',
        'CHANGE_NICKNAME',
        'MANAGE_NICKNAMES',
        'MANAGE_ROLES',
        'MANAGE_WEBHOOKS',
        'MANAGE_EMOJIS',
    ]

    for (const permission of permissions) {
        if (!validPermissions.includes(permission)) {
            throw new Error(`Unknown permission "${permission}"`)
        }
    }
}

module.exports = (bot, commandOptions) => {
    let {
        commands,
        description = '',
        category = 'commands',
        expectedArgs = '',
        permissionError = 'You do not have the required permissions to use this command',
        minArgs = 0,
        maxArgs = null,
        permissions = [],
        requiredRoles = [],
        callback
    } = commandOptions

    //Convert command to an array
    if (typeof commands === 'string') {
        commands = [commands]
    }

    if (permissions.length) {
        if (typeof permissions === 'string') {
            permissions = [permissions]
        }

        validatePermissions(permissions)
    }

    //Listen for message
    bot.on('message', message => {
        const { member, content, guild } = message

        if (customCommands.getIgnoredUsers().includes(message.member.user.id)) return

        try { if (member.user.bot) { return } }
        catch { return }

        const prefix = guildPrefixes[guild.id] || globalPrefix

        for (const alias of commands) {
            if (content.toLowerCase().startsWith(`${prefix}${alias.toLowerCase()}`)) {  //Run the command    

                //Determine arguments
                const arguments = content.split(/[ ]+/)

                //Make sure syntax is correct so if they type profilesdhfkjsdjf it doesn't return their profile
                if (arguments[0].substring(1) !== alias.toLowerCase()) {
                    if (customCommands.getCustomCommand(arguments[0].substring(1)).error) {
                        message.channel.send(new Discord.MessageEmbed({
                            title: 'That Command Does Not Exist',
                            description: "Need help? Type in " + `**${globalPrefix}help**\n` + `Looking for a custom command? Use **${globalPrefix}help commands** or **${globalPrefix}commands**`,
                            color: 'RED'
                        }))
                        return
                    }

                    return
                }

                arguments.shift() //Removes the first element          

                //But first check their roles
                for (const permission of permissions) {
                    if (!member.hasPermission(permission)) {
                        message.reply(permissionError)
                        return
                    }
                }

                for (const requiredRole of requiredRoles) {
                    const role = guild.roles.cache.find(role => role.name === requiredRole)

                    if (!role || !member.roles.cache.has(role.id)) {
                        reply.replyExclaim(message, "You don't have the required role(s) to use this command")
                        return
                    }
                }

                if (arguments.length < minArgs || (maxArgs !== null && arguments.length > maxArgs)) {
                    reply.replyExclaim(message, `Sorry, something went wrong. If you need help with this command, use **${globalPrefix}help ${commands[0]}**`)
                    return
                }

                //Everything worked! Let's run the command
                callback(message, arguments, arguments.join(' '), bot)

                return
            }
        }
    })
}

module.exports.loadPrefixes = async (bot) => {
    await mongo().then(async (mongoose) => {
        try {
            for (const guild of bot.guilds.cache) {
                const guildId = guild[1].id

                const result = await guildConfigSchema.findOne({ _id: guildId })
                guildPrefixes[guildId] = result.prefix
            }
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.refreshGuildPrefix = async (message) => {
    await mongo().then(async mongoose => {
        try {
            const guildId = message.guild.id
            const result = await guildConfigSchema.findOne({ _id: guildId })

            guildPrefixes[guildId] = result.prefix
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.getGuildPrefix = (guildId) => {
    return guildPrefixes[guildId] || globalPrefix
}