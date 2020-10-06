const EST = 3600000 * -5

module.exports.getFormattedMilitaryTime = () => {
    const today = new Date(new Date() + EST)
    const hours = today.getHours()
    const minutes = today.getMinutes().toString()
    const seconds = today.getSeconds().toString()
    const time = `${hours}:${minutes.length === 1 ? '0' + minutes : minutes} - ${seconds.length === 1 ? '0' + seconds : seconds}s`
    return time
}

module.exports.getFormattedMilitaryTimeMill = () => {
    const today = new Date(new Date() + EST)
    const hours = today.getHours()
    const minutes = today.getMinutes().toString()
    const seconds = today.getSeconds().toString()
    let milliseconds = today.getMilliseconds().toString()

    milliseconds = milliseconds.length === 1 ? '00' + milliseconds : milliseconds.length === 2 ? '0' + milliseconds : milliseconds

    const time = `${hours}:${minutes.length === 1 ? '0' + minutes : minutes} - ${seconds.length === 1 ? '0' + seconds : seconds}.${milliseconds}s`
    return time
}