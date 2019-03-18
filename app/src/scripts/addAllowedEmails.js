const emailValidator = require('email-validator')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db/db.json')
const db = low(adapter)


const newEmail = 'ads@afd.cd'

if (!emailValidator.validate(newEmail)) {
    console.log('Not an email');
    return false
}

db.get('allowedEmails').push(newEmail).write()
console.log('Email added');
return true
