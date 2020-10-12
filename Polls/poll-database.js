const mongo = require('../mongo')
const pollSchema = require('../schema/poll-schema')
const incognitoPollSchema = require('../schema/incognito-poll-schema')

module.exports.addPoll = async (messageId, channelId, endTime) => {
    await mongo().then(async mongoose => {
        try {
            console.log('ADDING POLL...')

            await new pollSchema({
                _id: messageId,
                channelId,
                endTime
            }).save()
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.addIncognitoPoll = async (messageId, channelId, setReactions, endTime) => {
    await mongo().then(async mongoose => {
        try {
            console.log('ADDING INCOGNITO POLL...')

            await new incognitoPollSchema({
                _id: messageId,
                channelId,
                setReactions,
                endTime
            }).save()
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.incognitoReactionAdded = async (pollId, reactionName, user) => {
    await mongo().then(async mongoose => {
        try {
            console.log('REACTION SUBMISSION MADE...')

            const id = user.id

            await incognitoPollSchema.findOneAndUpdate({
                _id: pollId
            }, {
                $push: { participants: id, reactions: reactionName }
            }, {
                upsert: true,
                useFindAndModify: false
            })
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.clearPoll = async (pollId) => {
    await mongo().then(async mongoose => {
        try {
            const found = await pollSchema.findOneAndDelete({
                _id: pollId
            }).catch(err => console.log(err))

            console.log('DELETED POLL', found)
        } finally {
            mongoose.connection.close()
        }
    })
}

module.exports.clearIncognitoPoll = async (pollId) => {
    await mongo().then(async mongoose => {
        try {
            const found = await incognitoPollSchema.findOneAndDelete({
                _id: pollId
            }).catch(err => console.log(err))

            console.log('DELETED POLL', found)
        } finally {
            mongoose.connection.close()
        }
    })
}

