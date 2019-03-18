const config = require('./configHelper')
const random = require('randomstring')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db/vote-' + config.getVoteName() + '.json')
const db = low(adapter)

exports.isBlocked = (type) => {
    if (!db.has('block.' + type).value()) {
        return true
    }
    return db.get('block.' + type).value()
}

exports.togleBlock = (type) => {
    if (!db.has('block').value()) {
        db.set('block', {}).write()
    }

    db.set('block.' + type, !db.get('block.' + type).value()).write()
}

exports.newUser = (email, token) => {
    if (!db.has('users').value()) {
        db.set('users', []).write()
    }

    if (!db.has('tokens').value()) {
        db.set('tokens', {}).write()
    }

    if (module.exports.isEmailUsed(email)) {
        return false
    }

    db.get('users').push(email).write()
    db.set('tokens.' + token, email).write()
    return true
}

exports.isEmailUsed = (email) => {
    const users = db.get('users').value()
    return users.includes(email)
}

exports.tokenExists = (token) => {
    return db.has('tokens.' + token).value()
}

exports.getResponsesForChallenges = (token, type = 'publicVotes') => {
    if (db.has(type + '.' + token).value()) {
        const responses = db.get(type + '.' + token).value()
        var challengeResponded = []
        var grades = {}
        for (var r in responses) {
            challengeResponded.push(r)

            grades[r] = []
            for (var k of Object.keys(responses[r]).sort()) {
                grades[r].push(responses[r][k] || '-')
            }
        }
        return {challengeResponded: challengeResponded, grades: grades}
    } else {
        return {challengeResponded: [], grades: {}}
    }
}

exports.registerResponse = (type, token, challengeId, grades) => {
    if (!db.has(type).value()) {
        db.set(type, {}).write()
    }

    if (!db.has(type + '.' + token).value()) {
        db.set(type + '.' + token, {}).write()
    }

    var g = {}
    for (var i = 0; i < grades.length; i++) {
        g['g' + (i + 1)] = prepareGrade(grades[i])
    }

    db.set(type + '.' + token + '.' + challengeId, g).write()
}

function prepareGrade(g) {
    return (g == '-') ? g : parseInt(g)
}

exports.computeResults = (type) => {
    const votesByToken = db.get(type).value()

    var defis = config.getChallenges()
    var results = {}
    for (var d of defis) {
        results[d.id] = {
            name: d.name,
            g1: {
                nbOfVotes: 0,
                cumVotes: 0
            },
            g2: {
                nbOfVotes: 0,
                cumVotes: 0
            },
            g3: {
                nbOfVotes: 0,
                cumVotes: 0
            },
            g4: {
                nbOfVotes: 0,
                cumVotes: 0
            }
        }
    }

    // Fill in results stats
    for (var tk in votesByToken) {
        for (var d in votesByToken[tk]) {
            for (var key of ['g1', 'g2', 'g3', 'g4']) {
                if (votesByToken[tk][d].hasOwnProperty(key)) {
                    if (votesByToken[tk][d][key] != '-') {
                        results[d][key].nbOfVotes += 1
                        results[d][key].cumVotes += votesByToken[tk][d][key]
                    }
                }
            }
        }
    }

    // Compute average grade for each defi
    for (var d in results) {
        results[d].g1.grade = (results[d].g1.nbOfVotes == 0) ? 0 : results[d].g1.cumVotes / results[d].g1.nbOfVotes
        results[d].g2.grade = (results[d].g2.nbOfVotes == 0) ? 0 : results[d].g2.cumVotes / results[d].g2.nbOfVotes
        results[d].g3.grade = (results[d].g3.nbOfVotes == 0) ? 0 : results[d].g3.cumVotes / results[d].g3.nbOfVotes
        results[d].g4.grade = (results[d].g4.nbOfVotes == 0) ? 0 : results[d].g4.cumVotes / results[d].g4.nbOfVotes

        // Final grade
        results[d].grade = results[d].g1.grade + results[d].g2.grade + results[d].g3.grade + results[d].g4.grade
    }

    // Prepare to sort
    var res = []
    for (var r in results) {
        res.push({id: r, data: results[r]})
    }

    return res.sort((a, b) => {
        return b.data.grade - a.data.grade
    })
}

exports.nbVoteParticipants = (type) => {
    const votes = db.get(type).value()

    return Object.keys(votes).length
}

// Jury ========================================================================

exports.newJuryAccessCode = () => {
    if (!db.has('juryAccessCodes').value()) {
        db.set('juryAccessCodes', []).write()
    }

    const newAccessCode = random.generate(8)
    db.get('juryAccessCodes').push(newAccessCode).write()

    return newAccessCode
}

exports.getJuryAccessCodes = () => {
    return db.get('juryAccessCodes').value() || []
}

exports.isValidAccessCode = (accessCode) => {
    if (db.has('juryAccessCodes').value()) {
        return this.getJuryAccessCodes().includes(accessCode)
    }
    return false
}
