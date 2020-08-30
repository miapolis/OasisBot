const path = require('path');
const fs = require('fs');


const Discord = require("discord.js");
const bot = new Discord.Client();

bot.on('ready', () => {
    console.log(`Logged in as this bot: ${bot.user.tag}`);

    const baseFile = 'command-base.js';
    const commandBase = require(`./commands/${baseFile}`);

    const readCommands = dir => {
        const files = path.join(__dirname, dir);

        for (const file of files) {
            const stat = fs.lstatSync(path.join(__dirname, dir, file));

            if (stat.isDirectory()) {
                readCommands(path.join(dir, file));
            }
            else if (file !== baseFile) {
                const option = path.join(__dirname, dir, file);

                console.log(`Loaded commands from ${file}`);
                commandBase(bot, option);
            }
        }
    }

    readCommands('commands');
});

bot.on('message', msg => {
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

bot.login(process.env.token);