const Discord = require('discord.js')
const leveling = require('../../Leveling/leveling')

module.exports = {
    commands: 'profile',
    description: 'Shows the profile of the specified user.',
    category: 'profiles',
    minArgs: 0,
    maxArgs: 1,
    expectedArgs: '<user>',
    callback: async (message, arguments, text) => {
        const mention = message.mentions.members.first()

        let member = message.author

        if (mention) {
            member = mention
        }

        //Check if the member is a bot
        if (member === mention && member.user.bot) {
            const botUser = message.mentions.users.first()

            const appos = member.displayName.charAt(member.displayName.length - 1) === 's' ? "'" : "'s"

            let botEmbed = new Discord.MessageEmbed({
                title: `${member.displayName}${appos} Profile`,
                description: "Yes, even bots have a profile!\n**But they can't join the fun level and rank party...** *uwu*",
                color: 'GREY',
            }).addField('MEE6 Level', 0).setThumbnail(botUser.displayAvatarURL())

            message.channel.send(botEmbed)
            return
        }

        const guildId = message.guild.id
        const userId = member.id

        const xpLevel = await leveling.getProfile(guildId, userId)

        const currentRoleId = leveling.getLevelRoleByOptions(xpLevel, true)
        const nextLevel = leveling.getNextMilestone(xpLevel)

        let currentRole, currentRoleText, nextRoleText

        if (currentRoleId !== 'NULL') {
            currentRole = message.guild.roles.cache.get(currentRoleId)
            currentRoleText = currentRole.name
        }
        else {
            currentRoleText = "This member doesn't have any level roles yet!"
        }

        if (nextLevel !== -1) {
            const nextRoleId = leveling.getLevelRoleByOptions(nextLevel, false)
            const nextRole = message.guild.roles.cache.get(nextRoleId)

            nextRoleText = nextRole.name
        }
        else {
            nextRoleText = `${message.guild.member(member).displayName} has reached the highest level!`
        }

        const appos = message.member.displayName.charAt(message.member.displayName.length - 1) === 's' ? "'" : "'s"

        let embed = new Discord.MessageEmbed().setTitle(`${message.member.displayName + appos} Profile`)
            .setDescription(`**${currentRoleText}**`)
            .addField('MEE6 Level', xpLevel)
            .addField('Next Role', nextRoleText)
            .setColor(currentRoleId !== 'NULL' ? currentRole.color : 'GREY')
            .setThumbnail(message.author.displayAvatarURL())

        message.channel.send(embed)
    }
}