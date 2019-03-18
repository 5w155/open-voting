const emailValidator = require('email-validator')
const random = require('randomstring')
const config = require('../helpers/configHelper')
const db = require('../helpers/dbHelper')
const tokenAccessHelper = require('../helpers/tokenAccessHelper')
const common = require('../helpers/commonHelper')

exports.getLogin = (req, res) => {
    res.render('juryVote/login', {})
}

exports.postLogin = (req, res) => {
    if (req.body.token == null
        || req.body.token == ""
        || req.body.token.length != 8
        || !db.isValidAccessCode(req.body.token))
    {
        res.render('juryVote/login', {
            error: "Invalid token"
        })
        return
    }

    const cookieToken = random.generate(64)
    tokenAccessHelper.setNewJuryToken(cookieToken, req.body.token)

    // Put the cookieToken into cookies
    res.cookie('juryToken', cookieToken, { signed: true, maxAge: 1000 * 60 * 200, httpOnly: true})

    res.redirect('/jury')
}

exports.logout = (req, res) => {
    if (req.signedCookies.juryToken != undefined && req.signedCookies.juryToken != null) {
        tokenAccessHelper.revokeJuryToken(req.signedCookies.juryToken)
    }

    res.clearCookie('juryToken');

    res.redirect('/jury/login')
}

// Returns the accessCode for this jury member
function getJuryAccessCodeIfVoteOpen(req, res) {
    const isOpen = !db.isBlocked('jury')
    if (!isOpen) {
        console.log("here");
        res.redirect('/close')
        return null
    }

    // If not logged in redirect to login
    if (req.signedCookies.juryToken == undefined) {
        res.redirect('/jury/login')
        return null
    }

    const accessCode = tokenAccessHelper.getJuryAccessCode(req.signedCookies.juryToken)
    if (accessCode == null) {
        res.redirect('/jury/login')
        return null
    }
    return accessCode
}

exports.getRecap = (req, res) => {
    const juryAccessCode = getJuryAccessCodeIfVoteOpen(req, res)
    if (juryAccessCode == null) {
        return
    }

    var challenges = config.getChallenges()
    const repliedToDefis = db.getResponsesForChallenges(juryAccessCode, 'juryVotes')
    for (var c of challenges) {
        c.replied = repliedToDefis.challengeResponded.includes(c.id)
        c.grades = []
        if (repliedToDefis.grades.hasOwnProperty(c.id)) {
            c.grades = repliedToDefis.grades[c.id]
        }
        c.name = common.reduceDefiName(c.name, 50)
    }

    var questions = config.getQuestionsJury()

    res.render('juryVote/recap', {challenges: challenges, questions: questions})
}

exports.getDefi = (req, res) => {
    const juryAccessCode = getJuryAccessCodeIfVoteOpen(req, res)
    if (juryAccessCode == null) {
        return
    }

    const challengeId = req.params.id
    const challenge = config.getChallengeById(challengeId)
    if (challenge == null) {
        res.redirect('/jury')
        return
    }
    const questions = config.getQuestionsJury()

    const repliedToDefis = db.getResponsesForChallenges(juryAccessCode, 'juryVotes')
    var grades = [null, null, null, null]
    if (repliedToDefis.challengeResponded.includes(challengeId)) {
        grades = repliedToDefis.grades[challengeId]
    }

    res.render('juryVote/defi', {id: challengeId, name: challenge.name, questions: questions, grades: grades})
}

exports.postDefi = (req, res) => {
    const juryAccessCode = getJuryAccessCodeIfVoteOpen(req, res)
    if (juryAccessCode == null) {
        return
    }

    const challengeId = req.params.id
    const challenge = config.getChallengeById(challengeId)
    if (challenge == null) {
        res.redirect('/jury')
        return
    }

    const grades = req.body
    var g = []
    for (var k of Object.keys(grades)) {
        if (k.startsWith('g')) {
            if (!config.isValidGradeForQuestion('jury', parseInt(k.substring(1, k.length)) - 1, grades[k])) {
                res.redirect('/jury/defi/' + challengeId)
                return
            }
            g.push(grades[k])
        }
    }

    db.registerResponse('juryVotes', juryAccessCode, challengeId, g)

    res.redirect('/jury')
}
