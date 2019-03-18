const config = require('./configHelper')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db/token-access-' + config.getVoteName() + '.json')
const db = low(adapter)

const TOKEN_VALIDITY_MINUTES = 120

// ADMIN TOKENS ================================================================

exports.setNewAdminToken = (token) => {
    if (!db.has('adminTokens').value()) {
        db.set('adminTokens', {}).write()
    }

    const createdAt = Date.now()

    db.set('adminTokens.' + token, createdAt).write()
}

exports.isAdminTokenValid = (token) => {
    if (!db.has('adminTokens.' + token).value()) {
        return false
    }

    const createdAt = db.get('adminTokens.' + token).value()
    if (Date.now() - createdAt > TOKEN_VALIDITY_MINUTES * 1000 * 60) {
        // Token expired
        return false
    } else {
        return true
    }
}

exports.revokeAdminToken = (token) => {
    if (db.has('adminTokens.' + token).value()) {
        db.unset('adminTokens.' + token).write()
    }
}

// JURY TOKENS =================================================================

exports.setNewJuryToken = (token, accessCode) => {
    if (!db.has('juryTokens').value()) {
        db.set('juryTokens', {}).write()
    }

    const createdAt = Date.now()

    db.set('juryTokens.' + token, {createdAt: createdAt, accessCode: accessCode}).write()
}

exports.getJuryAccessCode = (token) => {
    if (!db.has('juryTokens.' + token).value()) {
        return null
    }

    const juryAccess = db.get('juryTokens.' + token).value()
    if (Date.now() - juryAccess.createdAt > TOKEN_VALIDITY_MINUTES * 1000 * 60) {
        // Token expired
        return null
    } else {
        return juryAccess.accessCode
    }
}

exports.revokeJuryToken = (token) => {
    if (db.has('juryTokens.' + token).value()) {
        db.unset('juryTokens.' + token).write()
    }
}
