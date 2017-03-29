var should = require('should');
var SecurityService = require('../../src/services/SecurityService')

//this is just simple integration testing
describe('SecurityService', function () {

    describe.skip('#subscribe()', function () {
        it('Should fail if email address is empty', function (done) {
//            StorageService.store_file_in_container('',new Buffer(1),'image/jpeg','image/test.jpeg')
//                .fail(function(err){
//                    err.should.be.a.Error;
//                })
//                .then(done, done);
        });

        it('Should immediately add user to mailing list, without double optin.', function (done) {
//            StorageService.store_file_in_container('testcontainer',null,'image/jpeg','image/test.jpeg')
//                .fail(function(err){
//                    err.should.be.a.Error;
//                })
//                .then(done, done);
        });

    })
    describe.skip('#unsubscribe()', function(){
        it('Should return nothing if empty email', function () {

        });

    })

    describe.skip('#send()', function(){
        it('Should fail if no template provided', function (done) {
            var options = {
                to: {
                    email : 'test@test.com'
                },
                subject : "test subject"
            }

            MailService.send(options, null)
                .fail(function(err){
                    err.should.be.a.Error;
                })
                .then(done, done);
        });

        it('Should fail if no `to` email provided', function (done) {
            var options = {
                template : 'welcome',
                subject : "test subject"
            }

            MailService.send(options, null)
                .fail(function(err){
                    err.should.be.a.Error;
                })
                .then(done, done);
        });
        it('Should fail if no subject provided', function (done) {
            var options = {
                template : 'welcome',
                to: {
                    email : 'test@test.com'
                }
            }

            MailService.send(options, null)
                .fail(function(err){
                    err.should.be.a.Error;
                })
                .then(done, done);
        });
        it('Should fail if no email address provided', function (done) {
            var options = {
                template : 'welcome'
            }

            MailService.send(options, null)
                .fail(function(err){
                    err.should.be.a.Error;
                })
                .then(done, done);
        });

        it.skip('Should fail if template data does not match', function (done) {
            var options = {
                template : 'welcome',
                to: {
                    email : 'darkmethodz@gmail.com'
                },
                subject: "test subject"
            }

            MailService.send(options, null)
                .fail(function(err){
                    err.should.be.a.Error;
                })
                .then(done, done);
        });
    })
    describe.skip('#is_oauth_token_expired()', function () {
        it('Should be false if expires_on is null', function () {
            SecurityService.is_oauth_token_expired({oauth_data:{expires_on:null}}).should.be.false
        });

        it('Should be true if expires_on is in the past', function () {
            SecurityService.is_oauth_token_expired({oauth_data:{expires_on:"1970-01-01T00:00:00.000Z"}}).should.be.true
        });

        it('Should be false if expires_on is in the future', function () {
            SecurityService.is_oauth_token_expired({oauth_data:{expires_on:"2286-11-20T17:46:39.999Z"}}).should.be.false
        });

    });



});