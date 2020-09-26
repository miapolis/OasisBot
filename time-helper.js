module.exports.getFormattedMilitaryTime = () => {
    const today = new Date()
    const minutes = today.getMinutes().toString()
    const seconds = today.getSeconds().toString()
    const time = `${today.getHours()}:${minutes.length === 1 ? '0' + minutes : minutes} - ${seconds.length === 1 ? '0' + seconds : seconds}s`
    return time
}