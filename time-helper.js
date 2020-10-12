const moment = require('moment-timezone')

module.exports.getFormattedMilitaryTime = () => {
    var today = moment(Date.now().toString()).tz("America/New_York")

    const hours = today.getHours()
    const minutes = today.getMinutes().toString()
    const seconds = today.getSeconds().toString()
    const time = `${hours}:${minutes.length === 1 ? '0' + minutes : minutes} - ${seconds.length === 1 ? '0' + seconds : seconds}s`
    return time
}

module.exports.getFormattedMilitaryTimeMill = () => {
    var today = moment(Date.now().toString()).tz("America/New_York")

    const hours = today.getHours()
    const minutes = today.getMinutes().toString()
    const seconds = today.getSeconds().toString()
    let milliseconds = today.getMilliseconds().toString()

    milliseconds = milliseconds.length === 1 ? '00' + milliseconds : milliseconds.length === 2 ? '0' + milliseconds : milliseconds

    const time = `${hours}:${minutes.length === 1 ? '0' + minutes : minutes} - ${seconds.length === 1 ? '0' + seconds : seconds}.${milliseconds}s`
    return time
}