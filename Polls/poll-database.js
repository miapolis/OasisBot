const mongo = require('../mongo')
const pollSchema = require('../schema/poll-schema')

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