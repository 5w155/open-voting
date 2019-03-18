const emailValidator = require('email-validator')
const random = require('randomstring')
const config = require('../helpers/configHelper')
const db = require('../helpers/dbHelper')
const common = require('../helpers/commonHelper')

function isVoteOpen(res) {
    const isOpen = !db.isBlocked('public')
    if (!isOpen) {
        console.log("Redirect to close");
        res.redirect('/close')
    }
    return isOpen
}

exports.getLogin = (req, res) => {
    if (!isVoteOpen(res)) {
        return
    }

    if (req.signedCookies.token != undefined) {
        res.redirect('/recap')
    } else {
        res.render('publicVote/login')
    }
}

exports.postLogin = (req, res) => {
    if (!isVoteOpen(res)) {
        return
    }

    const email = req.body.email

    if (email == null || !emailValidator.validate(email)) {
        res.render('publicVote/login', {error: 'Email invalide'})
        return
    }

    const token = random.generate(32)

    // Store token->email
    if (!db.newUser(email, token)) {
        res.render('publicVote/login', {error: 'Cet email ne peut pas être utilisé où a déja été utilisée'})
        return
    }

    // Put token in cookies
    res.cookie('token', token, { signed: true, maxAge: 1000 * 60 * 200, httpOnly: true})

    // Redirect to recap
    res.redirect('/recap')
}

exports.getRecap = (req, res) => {
    if (!isVoteOpen(res)) {
        return
    }

    const token = req.signedCookies.token

    const challenges = config.getChallenges()
    const repliedToDefis = db.getResponsesForChallenges(token, 'publicVotes')
    for (var c of challenges) {
        c.replied = repliedToDefis.challengeResponded.includes(c.id)
        c.grades = []
        if (repliedToDefis.grades.hasOwnProperty(c.id)) {
            c.grades = repliedToDefis.grades[c.id]
        }
        c.name = common.reduceDefiName(c.name, 50)
    }

    var questions = config.getQuestionsPublic()

    res.render('publicVote/recap', {challenges: challenges, questions: questions})
}

exports.getDefi = (req, res) => {
    if (!isVoteOpen(res)) {
        return
    }

    const challengeId = req.params.id
    const challenge = config.getChallengeById(challengeId)
    if (challenge == null) {
        res.redirect('/jury')
        return
    }
    const questions = config.getQuestionsPublic()

    const token = req.signedCookies.token
    const repliedToDefis = db.getResponsesForChallenges(token, 'publicVotes')
    var grades = [null, null, null, null]
    if (repliedToDefis.challengeResponded.includes(challengeId)) {
        grades = repliedToDefis.grades[challengeId].map(i => i + "")
    }

    res.render('publicVote/defi', {id: challengeId, name: challenge.name, questions: questions, grades: grades})
}

exports.postDefi = (req, res) => {
    if (!isVoteOpen(res)) {
        return
    }

    const challengeId = req.params.id
    const challenge = config.getChallengeById(challengeId)
    if (challenge == null) {
        res.redirect('/')
        return
    }

    const grades = req.body
    var g = []
    for (var k of Object.keys(grades)) {
        if (k.startsWith('g')) {
            if (!config.isValidGradeForQuestion('public', parseInt(k.substring(1, k.length)) - 1, grades[k])) {
                res.redirect('/defi/' + challengeId)
                return
            }
            g.push(grades[k])
        }
    }

    db.registerResponse('publicVotes', req.signedCookies.token, challengeId, g)

    res.redirect('/')
}
