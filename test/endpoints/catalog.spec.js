var catalogHandler = require('../../src/catalog');
var DBService = require('../../src/services/db_service');
var JWTTokenService = require('../../src/services/jwt_token_service');
var Base64Service = require('../../src/services/base64_service');
var DBSchemas = require('../../src/common/db_schemas');
var should = require('should');
var q = require('q');
var path = require('path');
var fs = require('fs')

describe('Catalog Endpoints', function () {

    var token = 'test-token-catalog';
    var user_id;
    before(function(done){
        this.timeout(10000)

        var user = {
            "name": 'testplan',
            "plan": 'none',
            "email": 'catalog-books@example.com',
            "password_hash": 'testplanhash',
            "catalog_token": token
        };


        DBService.createUser(DBSchemas.User(user))
            .then(function(user_data){
                user_id = user_data.uid;

                var books_file = path.resolve(path.resolve(__dirname,'../fixtures/100_books.json'));
                var fake_books = JSON.parse(fs.readFileSync(books_file, 'utf8'));
                var promises = [];
                for(var ndx in fake_books){
                    var fake_book = fake_books[ndx];

                    fake_book.user_id = user_id;
                    fake_book.credential_id = 'catalog-credential-id'
                    promises.push(DBService.createBook(DBSchemas.Book(fake_book)))
                }

                return q.allSettled(promises)
            })
            .then(function(){})
            // .delay(1000)
            .then(done,done)
    });

    describe('#index()', function () {

        it('should correctly retrieve catalog index', function (done) {
            var event={
                path: {catalogToken: token},
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

        it('should correctly generate books catalog', function (done) {
            var event={
                path: {catalogToken: token},
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
    describe('#recent()', function () {

        it('should correctly generate recent catalog', function (done) {
            var event={
                path: {catalogToken: token},
                query: {},
                body:{}
            };
            var context={};
            function callback(ctx, data){
                should.not.exist(ctx)
                data.should.be.a.String
                done()
            }
            catalogHandler.recent(event, context, callback)
        })

    })

    describe('#seriesid()', function () {

        it('should correctly generate seriesid catalog when given a specific seriesId', function (done) {
            var event={
                path: {
                    catalogToken: token,
                    seriesId: Base64Service.urlEncode("Granite Practical Concrete Keyboard")
                },
                query: {},
                body:{}
            };
            var context={};
            function callback(ctx, data){
                should.not.exist(ctx)
                data.should.be.a.String
                done()
            }
            catalogHandler.recent(event, context, callback)
        })

    })
});

