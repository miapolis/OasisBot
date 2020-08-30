const discord = require("discord.js")
const { prefix } = require('../config.json');

const upperDescription = "View our [documentation](https://sites.google.com/view/oasisbot/documentation)\n" +
    "If you would like to send feedback or report a bug, fill out [this form](https://forms.gle/nwWKRLNJtqHW6Vfq9)\nIf you would like to further support this bot, specify **&donate**";

module.exports = {
    commands: 'help',
    callback: (message, arguments, text) => {
        let embed = new discord.MessageEmbed()
            .setTitle('Help')
            .setColor('AQUA')
            .setDescription(
                upperDescription + '\n\n' +
                `**${prefix}help commands` + '\n' +
                'Get help with custom commands!' + '\n\n' +
                `**${prefix}help profiles` + '\n' +
                'Get help with profiles!' + '\n\n' +
                `**${prefix}help polls` + '\n' +
                'Get help with polls!' + '\n\n' +
                `**${prefix}help roles` + '\n' +
                `Get help with this guild's roles!` + '\n\n' +
                `**${prefix}help usage` + '\n' +
                'Get help with the usage of this bot!' + '\n\n' +
                `**${prefix}help documentation` + '\n' +
                'Get help with the OasisBot documentation!' + '\n\n' +
                `**${prefix}help info` + '\n' +
                'Get info about this bot!'
            );

        message.channel.send(embed);
    }
}