var should = require('should');
var DBService = require('../../src/services/db_service')
//this is just simple integration testing
describe('DBService', function () {
    describe('listTables', function(){
        it('should correctly list all tables', function (done) {
            DBService.listTables()
                .then(function(tables){
                    tables.should.eql('THIS IS A FAKE TABLE')
                })
                .then(done, done);
        })
    })
})