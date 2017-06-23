var authHandler = require('../../src/auth');
var DBService = require('../../src/services/db_service');
var SecurityService = require('../../src/services/security_service');
var DBSchemas = require('../../src/common/db_schemas');
var should = require('should');

describe('Auth Endpoints', function () {
    describe('#register()', function () {
        before(function(done){
            var user = {
                "name": 'testplan',
                "email": 'alreadyexists@example.com',
                "password_hash": 'testplanhash',
                "catalog_token": 'testplancatalog'
            };
            DBService.createUser(DBSchemas.User(user))
                .then(function(){})
                .then(done, done);
        });

        it('should correctly register new user', function (done) {
            var event={
                body:{
                    name: 'test user',
                    email: 'authregister@example.com',
                    password: '12345'
                }
            };
            var context={};
            function callback(ctx, data){
                should.not.exist(ctx)
                data.token.should.exist;
                done()
            }
            authHandler.register(event, context, callback)
        })

        it('should return an error if user already exists', function (done) {
            var event={
                body:{
                    name: 'test user',
                    email: 'alreadyexists@example.com',
                    password: '12345'
                }
            };
            var context={};
            function callback(ctx, data){
                JSON.parse(ctx).message.should.exist;
                should.not.exist(data);
                done()
            }
            authHandler.register(event, context, callback)
        })
    })

    describe('#login()', function () {
        before(function(done){

            SecurityService.hash_password('myuserpassword')
                .then(function(password){
                    var user = {
                        "name": 'testplan',
                        "email": 'loginmyuser@example.com',
                        "password_hash": password,
                        "catalog_token": 'testplancatalog'
                    };
                    DBService.createUser(DBSchemas.User(user))

                })
                .then(function(){})
                .then(done, done);
        });

        it('should correctly login with existing user', function (done) {
            var event={
                body:{
                    email: 'loginmyuser@example.com',
                    password: 'myuserpassword'
                }
            };
            var context={};
            function callback(ctx, data){
                should.not.exist(ctx);
                data.token.should.exist;
                done()
            }
            authHandler.login(event, context, callback)
        })

        it('should return an error if user already exists', function (done) {
            var event={
                body:{
                    email: 'loginmyuser@example.com',
                    password: 'incorrectpassword'
                }
            };
            var context={};
            function callback(ctx, data){
                JSON.parse(ctx).message.should.exist;
                should.not.exist(data);
                done()
            }
            authHandler.login(event, context, callback)
        })
    });

});

