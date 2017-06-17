var should = require('should');
var AuthService = require('../../src/services/auth_service')
var DBService = require('../../src/services/db_service')
var SecurityService = require('../../src/services/security_service')
var q = require('q');
//this is just simple integration testing
describe('AuthService', function () {

    // describe('#createEmailUser()', function() {
    //     it('Should create a new user successfully', function (done) {
    //         q.spread([ DBService.get(), SecurityService.generate_catalog_token()],
    //             function(db_client, random_token){
    //                 return AuthService.createEmailUser(db_client, 'test name', random_token+'@example.com', '12345')
    //                     .then(function (users) {
    //                         var user = users[0]
    //                         //uid', 'catalog_token','email', 'name', 'plan
    //                         user.email.should.eql(random_token+'@example.com');
    //                         user.name.should.eql('test name');
    //                         user.plan.should.eql('none');
    //                     })
    //             })
    //             .then(done, done);
    //     });
    //
    //
    //     it('Should throw an error if trying to re-create with same email address', function (done) {
    //         q.spread([ DBService.get(), SecurityService.generate_catalog_token()],
    //             function(db_client, random_token){
    //                 return AuthService.createEmailUser(db_client, 'test name', random_token +'@example.com', '12345')
    //                     .then(function(db_client){
    //                         return AuthService.createEmailUser(db_client, 'test2 name', random_token + '@example.com', '12345')
    //                     })
    //             })
    //
    //             .fail(function (err) {
    //                 //uid', 'catalog_token','email', 'name', 'plan
    //                 err.should.be.an.Error;
    //             })
    //             .then(done, done);
    //     });
    //
    // });

})