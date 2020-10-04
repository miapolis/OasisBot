const Discord = require('discord.js')
const mongo = require('../mongo')
const profileSchema = require('../schema/profile-schema')

const profileCache = {} //guildId-userId: xp

//#region Role Defenitions

const LFIVE = '750740679054983209'
const LTEN = '750740730040811573'
const LFIFTEEN = '750740760395251773'
const LTWENTY = '750740807136444436'
const LTWENTYFIVE = '750740853386903663'
const LTHIRTY = '750740895967608943'
const LTHIRTYFIVE = ''
const LFORTY = ''
const LFORTYFIVE = ''
const LFIFTY = ''
const LFIFTYFIVE = ''
const LSIXTY = ''
const LONEHUNDRED = ''
const LONEFIFTY = ''
const LTWOHUNDRED = ''

//#endregion

module.exports.getProfile = async (guildId, userId) => {

    const cachedValue = profileCache[`${guildId}-${userId}`]

    if (cachedValue) { return cachedValue }

    return await mongo().then(async (mongoose) => {
        try {
            console.log('Running findOne()')

            const result = await profileSchema.findOne({
                guildId,
                userId
            })

            console.log('RESULT:', result)

            let xp = 0

            if (result) {
                xp = result.xpLevel
            } else {
                console.log('Inserting a document')

                await new profileSchema({
                    guildId,
                    userId,
                    xpLevel: xp
                }).save()
            }

            profileCache[`${guildId}-${userId}`] = xp;

            return xp

        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.updateProfile = async (guildId, userId, xp) => {
    return await mongo().then(async (mongoose) => {
        try {
            console.log('Running findOneAndUpdate()')

            const result = await profileSchema.findOneAndUpdate(
                {
                    guildId,
                    userId,
                },
                {
                    guildId,
                    userId,
                    xpLevel: xp
                },
                {
                    upsert: true,
                    new: true,
                }
            )

            console.log('NEW RESULT: ', result)

            profileCache[`${guildId}-${userId}`] = result.xpLevel

            return result.xpLevel
        }
        finally {
            mongoose.connection.close()
        }
    })
}

module.exports.startLeveling = async (bot) => {
    bot.on('message', async message => {
        if (!message.member) { return } //Sent in dms

        if (message.member.user.id === '159985870458322944') { //It's MEE6 
            if (message.content.includes('Wow you are now level') && message.mentions.members.first()) { //Message contains certian string and mentions user
                const target = message.mentions.members.first()

                const indexOfExclamationPoint = message.content.lastIndexOf('!')
                const lastIndexOfL = message.content.lastIndexOf('l')

                const startOfNumber = lastIndexOfL + 2

                let numberString = message.content.substring(startOfNumber, indexOfExclamationPoint)

                let levelNumber = parseInt(numberString)

                const userId = target.id
                const guildId = message.guild.id

                await this.updateProfile(guildId, userId, levelNumber)

                //#region Determining Role

                const roleId = this.getLevelRoleByOptions(levelNumber, false)

                if (roleId === 'NULL') { //No role has been found for current level
                    let nextMilestone = this.getNextMilestone(levelNumber)

                    if (nextMilestone !== -1) {
                        let nextRoleId = this.getLevelRoleByOptions(nextMilestone, false) //getNextMilestone() returns an exact value. There are now worries.
                        let nextRole = message.guild.roles.cache.get(nextRoleId)

                        let noRoleEmbed = new Discord.MessageEmbed({
                            title: `Wow! You just leveled up!`,
                            description: `${target.displayName}, you are now level ${levelNumber}!\nYour next role is **${nextRole.name}** at level ${nextMilestone}.`,
                            color: 'GOLD'
                        })

                        message.channel.send(noRoleEmbed)
                        return
                    }
                    else {
                        let epicEmbed = new Discord.MessageEmbed({
                            title: `Wow. No more.`,
                            description: `${target.displayName}, you are now level ${levelNumber}!\nThere will be no end to this.`,
                            color: 'GOLD'
                        })

                        message.channel.send(epicEmbed)
                        return
                    }
                }
                else { //We have landed on a level which is a level role
                    let roleId = this.getLevelRoleByOptions(levelNumber, false)
                    let role = message.guild.roles.cache.get(roleId)

                    //#region Adding new role and removing the previous one

                    target.roles.add(role)

                    const previousLevel = this.getPreviousLevel(levelNumber)

                    if (previousLevel !== 0) { //If we get to level 5 it shouldn't remove a role
                        let previousRoleId = this.getLevelRoleByOptions(previousLevel, false)
                        let previousRole = message.guild.roles.cache.get(previousRoleId)

                        if (target.roles.cache.has(previousRoleId)) { //In case the role got deleted
                            target.roles.remove(previousRole)
                        }
                    }

                    //#endregion

                    //Sending the embed is the last part

                    let roleEmbed = new Discord.MessageEmbed({
                        title: "SO \\*BIG!*",
                        description: `Wow! **${target.displayName}**, you are now level ${levelNumber} and have received the **${role.name}** role!\nCheck out your profile!`,
                        color: role.color
                    })

                    message.channel.send(roleEmbed)
                }

                //#endregion
            }
        }
    })
}

module.exports.getLevelRoleByOptions = (specifiedLevel, findingBestFit) => {
    if (findingBestFit) {
        if (specifiedLevel < 5) {
            return 'NULL'
        }

        if (specifiedLevel > 60 && specifiedLevel < 100) {
            return LSIXTY
        }

        if (specifiedLevel > 100 && specifiedLevel < 150) {
            return LONEHUNDRED
        }

        if (specifiedLevel > 150 && specifiedLevel < 200) {
            return LONEFIFTY
        }

        if (specifiedLevel >= 200) {
            return LTWOHUNDRED
        }

        specifiedLevel = specifiedLevel - specifiedLevel % 5

        switch (specifiedLevel) {
            case 5:
                return LFIVE
            case 10:
                return LTEN
            case 15:
                return LFIFTEEN
            case 20:
                return LTWENTY
            case 25:
                return LTWENTYFIVE
            case 30:
                return LTHIRTY
            case 35:
                return LTHIRTYFIVE
            case 40:
                return LFORTY
            case 45:
                return LFORTYFIVE
            case 50:
                return LFIFTY
            case 55:
                return LFIFTYFIVE
            case 60:
                return LSIXTY
            default:
                return 'NULL'
        }
    }
    else { //We are determining if a role should be added 
        switch (specifiedLevel) {
            case 5:
                return LFIVE
            case 10:
                return LTEN
            case 15:
                return LFIFTEEN
            case 20:
                return LTWENTY
            case 25:
                return LTWENTYFIVE
            case 30:
                return LTHIRTY
            case 35:
                return LTHIRTYFIVE
            case 40:
                return LFORTY
            case 45:
                return LFORTYFIVE
            case 50:
                return LFIFTY
            case 55:
                return LFIFTYFIVE
            case 60:
                return LSIXTY
            case 100:
                return LONEHUNDRED
            case 150:
                return LONEFIFTY
            case 200:
                return LTWOHUNDRED
            default:
                return 'NULL'
        }
    }
}

module.exports.getNextMilestone = (currentLevel) => {
    if (currentLevel < 60) {
        let roundedLevel = currentLevel - (currentLevel % 5)
        return roundedLevel + 5
    }

    if (currentLevel >= 60 && currentLevel < 100) {
        return 100
    }
    else if (currentLevel >= 100 && currentLevel < 150) {
        return 150
    }
    else if (currentLevel >= 150 && currentLevel < 200) {
        return 200
    }
    else if (currentLevel >= 200) {
        return -1
    }
}

module.exports.getPreviousLevel = (currentLevel) => {
    if (currentLevel < 60) {
        let roundedLevel = currentLevel - (currentLevel % 5)
        return roundedLevel - 5
    }

    if (currentLevel >= 60 && currentLevel < 100) {
        return 60
    }
    else if (currentLevel >= 100 && currentLevel < 150) {
        return 100
    }
    else if (currentLevel >= 150 && currentLevel < 200) {
        return 150
    }
    else if (currentLevel >= 200) {
        return -1
    }
}
