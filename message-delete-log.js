const Discord = require('discord.js')

const timeHelper = require('./time-helper')

module.exports.start = async (bot) => {
    bot.on('messageDelete', async (messageDelete) => {
        await Discord.Util.delayFor(900)

        const time = timeHelper.getFormattedMilitaryTime()

        if (messageDelete.log === false) {
            console.log('MESSAGE IGNORED', messageDelete.content)
            return
        }

        const deletedEmbed = new Discord.MessageEmbed({
            description: `**Message sent by <@${messageDelete.author.id}> deleted in ${messageDelete.channel}**\n` + `${messageDelete.content || "?"}`,
            color: '#ff0000'
        }).setAuthor(messageDelete.author.tag, messageDelete.member.user.displayAvatarURL())
            .setFooter(`${messageDelete.guild.name} | Message ID: ${messageDelete.id} • Today at ${time}`, messageDelete.guild.iconURL())

        const deleteChannel = messageDelete.guild.channels.cache.find(x => x.name === "delete-log");
        deleteChannel.send(deletedEmbed);
    })
}
