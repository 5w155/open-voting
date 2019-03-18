const random = require('randomstring')
const config = require('../helpers/configHelper')
const db = require('../helpers/dbHelper')
const tokenAccessHelper = require('../helpers/tokenAccessHelper')
const common = require('../helpers/commonHelper')

exports.getLogin = (req, res) => {
    res.render('admin/login', {})
}

exports.postLogin = (req, res) => {
    if (req.body.token == null
        || req.body.token == ""
        || req.body.token.length < 10
        || req.body.token.length > 30
        || !config.isValidAdminToken(req.body.token))
    {
        res.render('admin/login', {
            error: "Invalid token"
        })
        return
    }

    const cookieToken = random.generate(64)
    tokenAccessHelper.setNewAdminToken(cookieToken)

    // Put the cookieToken into cookies
    res.cookie('adminToken', cookieToken, { signed: true, maxAge: 1000 * 60 * 200, httpOnly: true})

    res.redirect('/admin')
}

exports.logout = (req, res) => {
    if (req.signedCookies.adminToken != undefined && req.signedCookies.adminToken != null) {
        tokenAccessHelper.revokeAdminToken(req.signedCookies.adminToken)
    }

    res.clearCookie('adminToken');

    res.redirect('/admin/login')
}

function verifyAdminToken(req, res) {
    // If not logged in redirect to login
    if (req.signedCookies.adminToken == undefined
        || !tokenAccessHelper.isAdminTokenValid(req.signedCookies.adminToken))
    {
        res.redirect('/admin/login')
        return false
    }

    return true
}

exports.getHome = (req, res) => {
    if (!verifyAdminToken(req, res)) {
        return
    }

    const publicVote = db.isBlocked('public') ? 'Open' : 'Close'
    const juryVote = db.isBlocked('jury') ? 'Open' : 'Close'

    const juryTokens = db.getJuryAccessCodes()

    res.render('admin/admin', {
        juryTokens: juryTokens,
        publicVote: publicVote,
        juryVote: juryVote
    })
}

exports.toggleVote = (req, res) => {
    if (!verifyAdminToken(req, res)) {
        return
    }

    switch (req.params.vote) {
        case 'public':
            db.togleBlock('public')
            break;

        case 'jury':
            db.togleBlock('jury')
            break;
        default:
    }

    res.redirect('/admin')
}

exports.newJuryToken = (req, res) => {
    if (!verifyAdminToken(req, res)) {
        return
    }

    const code = db.newJuryAccessCode()

    res.redirect('/admin')
}

// Results =====================================================================

exports.getResults = (req, res) => {
    if (!verifyAdminToken(req, res)) {
        return
    }

    var result = null
    var nbParticipants = 0
    var titles = null
    var viewToRender = null
    switch (req.params.type) {
        case 'jury':
            results = db.computeResults('juryVotes')
            nbParticipants = db.nbVoteParticipants('juryVotes')
            titles = results.map(item => {
                var totalPoints = 0
                for (var p of Object.keys(item.data)) {
                    if (p.startsWith('g') && !isNaN(parseInt(p.substring(1, p.length)))) {
                        totalPoints += item.data[p].grade
                    }
                }
                return '\'' + item.id + ': ' + common.reduceDefiName(item.data.name) + ' [' + totalPoints.toFixed(2) + ' pt]' + '\''
            })

            viewToRender = 'juryVote/results'
            break;

        case 'public':
            results = db.computeResults('publicVotes')
            nbParticipants = db.nbVoteParticipants('publicVotes')
            titles = results.map(item => '\'' + item.id + ': ' + common.reduceDefiName(item.data.name) + '\'')
            viewToRender = 'publicVote/results'
            break;
        default:

    }

    var responseParameters = {
        graph: true,
        label: 'Points obtenues',
        titles: titles,
        nbParticipants: nbParticipants
    }

    if (results.length > 0) {
        for (var p of Object.keys(results[0].data)) {
            if (p.startsWith('g') && !isNaN(parseInt(p.substring(1, p.length)))) {
                responseParameters['grades' + parseInt(p.substring(1, p.length))] = results.map(item => item.data['g' + parseInt(p.substring(1, p.length))].grade)
            }
        }
    }

    res.render(viewToRender, responseParameters);
}
