//todo: create any missing tables using before hook of mocha. clean up all tables after.
var should = require('should');
var DBService = require('../src/services/db_service')
var nconf = require('../src/common/nconf');
var path = require('path');
var nock = require('nock');
var sanitize = require('sanitize-filename');
var yaml = require('js-yaml');
var fs   = require('fs');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Before & After full test suite
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
before(function(done){
    // These tables should match the tabels in cloudformation-resources.yml
    var cfData = yaml.safeLoad(fs.readFileSync('./cloudformation-resources.yaml', 'utf8'));
    var usersTable = cfData.QuietThymeUsersTable.Properties;
    usersTable.TableName = 'quietthyme-api-' + nconf.get('STAGE') + '-users'
    var credsTable = cfData.QuietThymeCredsTable.Properties;
    credsTable.TableName = 'quietthyme-api-' + nconf.get('STAGE') + '-credentials'
    var booksTable = cfData.QuietThymeBooksTable.Properties;
    booksTable.TableName = 'quietthyme-api-' + nconf.get('STAGE') + '-books'

    DBService.createTable(usersTable)
    // .fail(function(){
    //     console.log("Users Table already exists")
    // })
        .then(function(){
            return DBService.createTable(credsTable)
        })
        // .fail(function(){
        //     console.log("Creds Table already exists")
        // })
        .then(function(){
            return DBService.createTable(booksTable)
        })
        // .fail(function(){
        //     console.log("Books Table already exists")
        // })
        .then(function(){})
        .then(done, done);
});

after(function(done) {
    var usersTable = {
        TableName: 'quietthyme-api-' + nconf.get('STAGE') + '-users'
    };

    var credsTable = {
        TableName: 'quietthyme-api-' + nconf.get('STAGE') + '-credentials'
    };

    var booksTable = {
        TableName: 'quietthyme-api-' + nconf.get('STAGE') + '-books'
    };

    DBService.deleteTable(usersTable)
        .fail(function(){
            console.log("Could not delete Users Table")
        })
        .then(function(){
            return DBService.deleteTable(credsTable)
        })
        .fail(function(){
            console.log("Could not delete Creds Table")
        })
        .then(function(){
            return DBService.deleteTable(booksTable)
        })
        .fail(function(){
            console.log("Could not delete Books Table")
        })
        .then(function(){})
        .then(done, done);
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Before & After each test
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///This is from https://github.com/porchdotcom/nock-back-mocha with some modifications

var nockFixtureDirectory = path.resolve(path.resolve(__dirname,'fixtures/recordings'));

var filenames = [];


//this function filters/transforms the request so that it matches the data in the recording.
function afterLoad(recording){
    nock.enableNetConnect('localhost')
    recording.transformPathFunction = function(path){
        return removeSensitiveData(path);
    }

    // recording.scopeOptions.filteringScope = function(scope) {
    //
    //     console.log("SCOPE", scope)
    //     return /^https:\/\/api[0-9]*.dropbox.com/.test(scope);
    // };
    // recording.scope = recording.scope.replace(/^https:\/\/api[0-9]*.dropbox.com/, 'https://api.dropbox.com')
}

//this function removes any sensitive data from the recording so that it will not be included in git repo.
function afterRecord(recordings) {
    console.log('>>>> Removing sensitive data from recording');
    // console.dir(recordings);

    for(var ndx in recordings){
        var recording = recordings[ndx]

        recording.path = removeSensitiveData(recording.path)
        recording.response = removeSensitiveData(recording.response)
    }
    return recordings
};


function removeSensitiveData(rawString){
    var encoded = false
    if(typeof rawString !== 'string'){
        rawString = JSON.stringify(rawString);
        encoded = true;
    }

    if(process.env.OAUTH_GOODREADS_CLIENT_KEY) {
        rawString = rawString.replace(new RegExp(process.env.OAUTH_GOODREADS_CLIENT_KEY, 'g') , 'PLACEHOLDER_CLIENT_KEY')
    }

    if(process.env.OAUTH_GOODREADS_CLIENT_SECRET){
        rawString = rawString.replace(new RegExp( process.env.OAUTH_GOODREADS_CLIENT_SECRET, "g"), 'PLACEHOLDER_CLIENT_SECRET' )
    }

    if(encoded){
        rawString = JSON.parse(rawString)
    }
    return rawString
}


beforeEach(function (done) {
    var fullTitle = this.currentTest.fullTitle();
    if(!fullTitle.includes('@nock')){
        nock.cleanAll();
        nock.enableNetConnect();
        return done()
    }

    nock.enableNetConnect('localhost');
    var filename = sanitize(this.currentTest.fullTitle() + '.json');
    // make sure we're not reusing the nock file
    if (filenames.indexOf(filename) !== -1) {
        return done(new Error('Nock does not support multiple tests with the same name. `' + filename + '` cannot be reused.'));
    }
    filenames.push(filename);

    var previousFixtures = nock.back.fixtures;
    nock.back.fixtures = nockFixtureDirectory;
    nock.back.setMode('record');
    nock.back(filename, {
        after: afterLoad,
        afterRecord: afterRecord
    }, function (nockDone) {
        this.currentTest.nockDone = function () {
            nockDone();
            nock.back.fixtures = previousFixtures;
        };
        done();
    }.bind(this));
});

afterEach(function () {
    var fullTitle = this.currentTest.fullTitle();
    if(!fullTitle.includes('@nock')){
        return
    }

    this.currentTest.nockDone();
});