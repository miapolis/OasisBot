const discord = require("discord.js")

const upperDescription = "View our [documentation](https://sites.google.com/view/oasisbot/documentation)\n" +
    "If you would like to send feedback or report a bug, fill out [this form](https://forms.gle/nwWKRLNJtqHW6Vfq9)\nIf you would like to further support this bot, specify **&donate**";

module.exports = {
    commands: 'help',
    callback: (message, arguments, text) => {
        let embed = new discord.MessageEmbed()
            .setTitle('Help')
            .setDescription(
                upperDescription + '\n\n' + 'HAHAH'
            );

        message.channel.send(embed);
    }
}