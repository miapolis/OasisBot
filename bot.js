const Discord = require("discord.js");
const client = new Discord.Client();

const prefix = '&';

const token = "NzQ5NjQ5NzcxNjM5MzQxMjA3.X0vDwQ.iVOxppzs1apIPPC9AVkqQxprUgA"; // Temporary

client.login(token);

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