var should = require('should');
var SecurityService = require('../../src/services/security_service')

//this is just simple integration testing
describe('SecurityService', function () {

    describe('#hash_password()', function () {
        it('Should encrypt a password', function (done) {
            SecurityService.hash_password('mypassword')
               .then(function(password){
                   password.should.exist;
               })
               .then(done, done);
        });

        it('Should raise an error if password is empty', function (done) {
            SecurityService.hash_password('')
                .fail(function(error){
                    error.should.eql("Password cannot be empty");
                })
                .then(done, done);
        });

    })
    describe('#compare_password()', function(){
        it('Should correctly compare & validate a password', function (done) {
            SecurityService.compare_password('mypassword', '$2a$10$pjgC5mbJcx3YxQyDSqjrcuZA1NcrAGz3LxqtG.Mtys8yT4Y2mkpk6')
                .then(function(matches){
                    matches.should.be.true;
                })
                .then(done, done);
        });

        it('Should correctly compare & validate a password again', function (done) {
            SecurityService.compare_password('mypassword', '$2a$10$aBaP8g47puhMbHnQM1bzvODWpPsx80/o67QhpOdnZTczAhBSG5hei')
                .then(function(matches){
                    matches.should.be.true;
                })
                .then(done, done);
        });

    })
});