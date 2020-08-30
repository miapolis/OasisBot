const Discord = require("discord.js");
const client = new Discord.Client();

const prefix = '&';

client.login(process.env.token);

client.on('ready', () => {
    console.log(`Logged in as this bot: ${client.user.tag}`);
});

client.on('message', msg => {
    if (msg.content.startsWith(prefix)) {
        if (msg.content.includes('hello')) {
            var embed = new Discord.MessageEmbed()
                .setTitle(`Hello ${msg.author.username}!`)
                .setColor('GOLD')
                .setDescription('Hello user! What a fine day!');

            msg.channel.send(embed);
        }
    }
});