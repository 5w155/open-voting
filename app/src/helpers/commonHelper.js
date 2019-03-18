exports.reduceDefiName = (name, maxLength = 30) => {
    if (name.length > maxLength) {
        return name.substring(0, maxLength - 3) + '...'
    } else {
        return name
    }
}
