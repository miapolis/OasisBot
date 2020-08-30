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
            msg.channel.send('hello');
        }
    }
});