const mongoose = require('mongoose')
let mongoPath = ''

module.exports = async () => {
    await mongoose.connect(mongoPath, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    return mongoose
}

module.exports.configure = (isHosting) => {
    if (isHosting) { mongoPath = process.env.mongopath }
    else { mongoPath = require('./secret-tokens.json').mongoPath }
} 