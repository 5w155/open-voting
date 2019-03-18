const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db/db.json')
const db = low(adapter)
const createCSVFile = require('csv-file-creator')

const header = ['email', 'D01', 'D02', 'D03']
const tokens = db.get('tokens').value()
const responses = db.get('responses').value()

var data = [header]
for (var tk in responses) {
    const row = [tokens[tk]]
    for (var resp in responses[tk]) {
        row.push(responses[tk][resp])
    }
    data.push(row)
}

createCSVFile("db/export.csv", data);
