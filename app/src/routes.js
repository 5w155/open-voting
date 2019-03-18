const express = require('express')
const router = express.Router();

const publicVoteVC = require('./controllers/publicVoteContr')
const juryVoteContr = require('./controllers/juryVoteContr')
const adminContr = require('./controllers/adminContr')

const db = require('./helpers/dbHelper')

// Require valid token in cookies
function requireToken(req, res, next) {
    if (req.signedCookies.token === undefined) {
        res.redirect('/login')
        //res.status(401).send('Unautorized')
    } else {
        if (db.tokenExists(req.signedCookies.token)) {
            next()
        } else {
            res.redirect('/login')
            //res.status(401).send('Unautorized - invalid token')
        }
    }
}

// Public vote =================================================================

router.get('/', (req, res) => {
    res.redirect('/recap')
})

router.get('/close', (req, res) => {
    res.render('close', {})
})

router.get('/login', publicVoteVC.getLogin)
router.post('/login', publicVoteVC.postLogin)

// Home page with list of challenges
router.use('/recap', requireToken)
router.get('/recap', publicVoteVC.getRecap)

// Challenge vote page
router.use('/defi', requireToken)
router.get('/defi/:id', publicVoteVC.getDefi)
router.post('/defi/:id', publicVoteVC.postDefi)

// Jury vote ===================================================================

router.get('/jury/login', juryVoteContr.getLogin)
router.post('/jury/login', juryVoteContr.postLogin)
router.get('/jury/logout', juryVoteContr.logout)

// Home page with list of challenges
router.get('/jury', juryVoteContr.getRecap)

// Challenges voting page
router.get('/jury/defi/:id', juryVoteContr.getDefi)
router.post('/jury/defi/:id', juryVoteContr.postDefi)

// Admin console ===========================================================

router.get('/admin/login', adminContr.getLogin)
router.post('/admin/login', adminContr.postLogin)
router.get('/admin/logout', adminContr.logout)

router.get('/admin', adminContr.getHome)

router.post('/admin/toggleVote/:vote', adminContr.toggleVote)

router.get('/admin/newJuryToken', adminContr.newJuryToken)

router.get('/admin/results/:type', adminContr.getResults)

module.exports = router;
