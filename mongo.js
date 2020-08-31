const mongoose = require('mongoose')

const mongoPath = "mongodb+srv://oasisbot:HLHbZf4o5McSjVq3@oasisbot-cluster.4dxds.mongodb.net/<oasis-db>?retryWrites=true&w=majority"

module.exports = async () => {
    await mongoose.connect(mongoPath, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    return mongoose
}