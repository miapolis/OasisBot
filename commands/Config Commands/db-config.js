const Discord = require('discord.js')
const bot = require('../../bot')

const mongo = require('../../mongo')
const customCommandsSchema = require('../../schema/custom-command-schema')

const embedColor = require('../../embed-color.json')

module.exports = {
    commands: 'db',
    description: 'Shows stats for the Oasis Database.',
    category: 'admin',
    permissions: 'ADMINISTRATOR',
    minArgs: 0,
    maxArgs: 0,
    callback: async (message) => {
        await mongo().then(async mongoose => {
            try {
                await customCommandsSchema.collection.stats().then(stats => {
                    const collectionSize = formatBytes(stats.storageSize)
                    const avgObjSize = formatBytes(stats.avgObjSize)
                    const numObjs = stats.count
                    const percentage = (stats.storageSize / 536870912) * 100

                    let embed = new Discord.MessageEmbed({
                        title: 'Database Statistics',
                        description: 'Logical size for this collection (custom commands).',
                        color: embedColor.FRIENDLY_RED
                    })
                        .addField('Collection Size', collectionSize, true)
                        .addField('Average Object Size', avgObjSize, true)
                        .addField('Number of Objects', numObjs, true)
                        .addField('Percentage', `${percentage}%`)
                        .setFooter('Oasis Database', bot.getClient().user.displayAvatarURL())

                    message.channel.send(embed)
                })
            }
            finally {
                mongoose.connection.close()
            }
        })
    }
}

module.exports.formatBytes = (bytes, decimals = 2) => { //StackOverflow + Copy Paste = :) 
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}