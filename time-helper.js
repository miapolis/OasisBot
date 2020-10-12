const moment = require('moment-timezone')

module.exports.getFormattedMilitaryTime = () => {
    var today = moment.utc(new Date().toISOString()).tz("America/New_York").subtract(4, 'hours').toDate()

    const hours = today.getHours()
    const minutes = today.getMinutes().toString()
    const seconds = today.getSeconds().toString()
    const time = `${hours}:${minutes.length === 1 ? '0' + minutes : minutes} - ${seconds.length === 1 ? '0' + seconds : seconds}s`
    return time
}

module.exports.getFormattedMilitaryTimeMill = () => {
    var today = moment.utc(new Date().toISOString()).tz("America/New_York").subtract(4, 'hours').toDate()

    const hours = today.getHours()
    const minutes = today.getMinutes().toString()
    const seconds = today.getSeconds().toString()
    let milliseconds = today.getMilliseconds().toString()

    milliseconds = milliseconds.length === 1 ? '00' + milliseconds : milliseconds.length === 2 ? '0' + milliseconds : milliseconds

    const time = `${hours}:${minutes.length === 1 ? '0' + minutes : minutes} - ${seconds.length === 1 ? '0' + seconds : seconds}.${milliseconds}s`
    return time
}

module.exports.getGoodDate = () => {
    return moment.utc(new Date().toISOString()).tz("America/New_York").subtract(4, 'hours').toDate()
}

module.exports.getGoodDateWithParams = (ms) => {
    return moment.utc(new Date(ms).toISOString()).tz("America/New_York").subtract(4, 'hours').toDate()
}