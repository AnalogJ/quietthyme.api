var catalogHandler = require('../../src/catalog');
var DBService = require('../../src/services/db_service');
var JWTTokenService = require('../../src/services/jwt_token_service');
var DBSchemas = require('../../src/common/db_schemas');
var should = require('should');

describe('Catalog Endpoints', function () {
    describe('#index()', function () {
        var token;
        before(function(done){
            var user = {
                "name": 'testplan',
                "plan": 'none',
                "email": 'catalog-index@example.com',
                "password_hash": 'testplanhash',
                "catalog_token": 'testplancatalogindex'
            };
            DBService.createUser(DBSchemas.User(user))
                .then(function(user_data){
                    return JWTTokenService.issue({
                        uid: user_data.uid,
                        plan: user_data.plan,
                        catalog_token: user_data.catalog_token,
                        name: user_data.name,
                        email: user_data.email
                    })
                })
                .then(function(_token){
                    token = _token;
                })
                .then(done, done);
        });

        it('should correctly retrieve catalog index', function (done) {
            var event={
                path: {catalogToken: 'testplancatalogindex'},
                query: {},
                body:{}
            };
            var context={};
            function callback(ctx, data){
                should.not.exist(ctx)
                data.should.be.a.String
                done()
            }
            catalogHandler.index(event, context, callback)
        })
    });

    describe('#series()', function () {})
    describe('#books()', function () {
        var token;
        var user_id;
        before(function(done){
            var user = {
                "name": 'testplan',
                "plan": 'none',
                "email": 'catalog-index@example.com',
                "password_hash": 'testplanhash',
                "catalog_token": 'testplancatalogbooks'
            };


            DBService.createUser(DBSchemas.User(user))
                .then(function(user_data){
                    user_id = user_data.uid;
                    return JWTTokenService.issue({
                        uid: user_data.uid,
                        plan: user_data.plan,
                        catalog_token: user_data.catalog_token,
                        name: user_data.name,
                        email: user_data.email
                    })
                })
                .then(function(_token){
                    token = _token;
                    //create a 4 books for this user.

                    var book = {
                        user_id: user_id,
                        credential_id: 'catalog-books-credential-id',
                        storage_size: 123456,
                        storage_identifier: 'storage-id/test/1',
                        storage_filename: 'book',
                        storage_format: 'epub',
                        title: 'this is my book title'
                    };

                    return DBService.createBook(DBSchemas.Book(book))
                        .then(function(){
                            book.storage_identifier = 'storage-id/test/2';
                            return DBService.createBook(DBSchemas.Book(book))
                        })
                        .then(function(){
                            book.storage_identifier = 'storage-id/test/3';
                            return DBService.createBook(DBSchemas.Book(book))
                        })
                        .then(function(){
                            book.storage_identifier = 'storage-id/test/4';
                            return DBService.createBook(DBSchemas.Book(book))
                        })
                        .then(function(){})
                })
                .then(done, done);
        });

        it('should correctly generate books catalog', function (done) {
            var event={
                path: {catalogToken: 'testplancatalogbooks'},
                query: {},
                body:{}
            };
            var context={};
            function callback(ctx, data){
                should.not.exist(ctx)
                data.should.be.a.String
                done()
            }
            catalogHandler.books(event, context, callback)
        })

    })

});

