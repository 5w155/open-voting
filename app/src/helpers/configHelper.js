const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('config/vote-config.json')
const configDB = low(adapter)

exports.getVoteName = () => {
    return configDB.get('dbName').value()
}

exports.getQuestionsPublic = () => {
    return configDB.get('questionsPublic').value()
}

exports.getQuestionsJury = () => {
    return configDB.get('questionsJury').value()
}

exports.getChallenges = () => {
    return configDB.get('challenges').value()
}

exports.isValidAdminToken = (token) => {
    const adminToken = configDB.get('adminToken').value()
    return token == adminToken
}

exports.getChallengeById = (id) => {
    const challenges = this.getChallenges()
    for (var c of challenges) {
        if (c.id == id) {
            return c
        }
    }
    return null
}

exports.isValidGradeForQuestion = (type, questionIdx, value) => {
    const questionType = (type == 'jury') ? 'questionsJury' : 'questionsPublic'
    const questions = configDB.get(questionType).value()

    if (questionIdx >= questions.length || questionIdx < 0) {
        return false
    }

    const question = questions[questionIdx]
    const possibleValues = question.answers.map(item => item.value + "")

    return possibleValues.includes(value) || value == '-'
}
