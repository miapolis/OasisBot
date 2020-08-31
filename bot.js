const { localToken } = require('./config.json');

const Discord = require("discord.js");
const bot = new Discord.Client();

const mongo = require('./mongo');

const loadCommands = require('./commands/load-commands')

const IS_HOSTING = true;

bot.on('ready', async () => {
    console.log(`Logged in as this bot: ${bot.user.tag}`);

    loadCommands(bot)

    await mongo().then(mongoose => {
        try {
            console.log('Connected to MongoDB!');
        } finally {
            mongoose.connection.close();
        }
    });
});

if (IS_HOSTING) {
    bot.login(process.env.token);
}
else {
    bot.login(localToken);
}
