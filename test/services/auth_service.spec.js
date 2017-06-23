var should = require('should');
var AuthService = require('../../src/services/auth_service')
var DBService = require('../../src/services/db_service')
var SecurityService = require('../../src/services/security_service')
var q = require('q');
//this is just simple integration testing
describe('AuthService', function () {

    describe('#createEmailUser()', function(){
        it('should correctly create user', function (done) {
            AuthService.createEmailUser('testAuthCreate', 'testAuthCreate@example.com','testAuthPassword')
                .then(function(user){
                    user.name.should.eql('testAuthCreate')
                    user.email.should.eql('testAuthCreate@example.com')
                })
                .then(done, done);
        })
    })

    // it('Should throw an error if trying to re-create with same email address', function (done) {
    //     q.spread([ DBService.get(), SecurityService.generate_catalog_token()],
    //         function(db_client, random_token){
    //             return AuthService.createEmailUser(db_client, 'test name', random_token +'@example.com', '12345')
    //                 .then(function(db_client){
    //                     return AuthService.createEmailUser(db_client, 'test2 name', random_token + '@example.com', '12345')
    //                 })
    //         })
    //
    //         .fail(function (err) {
    //             //uid', 'catalog_token','email', 'name', 'plan
    //             err.should.be.an.Error;
    //         })
    //         .then(done, done);
    // });


})