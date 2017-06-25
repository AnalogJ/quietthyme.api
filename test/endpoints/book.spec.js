var bookHandler = require('../../src/book');
var DBService = require('../../src/services/db_service');
var JWTTokenService = require('../../src/services/jwt_token_service');
var DBSchemas = require('../../src/common/db_schemas');
var should = require('should');

describe('Book Endpoints', function () {
    describe('#create()', function () {
        var token;
        before(function(done){
            var user = {
                "name": 'testplan',
                "plan": 'none',
                "email": 'book-create@example.com',
                "password_hash": 'testplanhash',
                "catalog_token": 'testplancatalog'
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

        it('should correctly create new book from calibre', function (done) {
            this.timeout(5000);
            var event={
                token: token,
                path: {},
                query: {source: 'calibre'},
                body:{ amazon_id: '0061840254',
                    authors: [ 'Ian Douglas' ],
                    average_rating: 8,
                    barnesnoble_id: 'w/earth-strike-ian-douglas/1018819002',
                    calibre_id: '2ac79e4a-b0f3-4307-8f92-f58ea050d38d',
                    google_id: 'i2b2zhEjxvkC',
                    isbn: '9780061840258',
                    last_modified: '2017-03-04T20:17:51.452429Z',
                    published_date: '2017-03-04T20:17:51.452423Z',
                    publisher: 'HarperCollins',
                    series_name: 'Star Carrier',
                    series_number: 1,
                    short_summary: '<blockquote><p>The first book in the epic saga of humankind\'s war of transcendence</p><p>There is a milestone in the evolution of every sentient race, a Tech Singularity Event, when the species achieves transcendence through its technological advances. Now the creatures known as humans are near this momentous turning point.</p><p>But an armed threat is approaching from deepest space, determined to prevent humankind from crossing over that boundary—by total annihilation if necessary.</p></blockquote><p>To the Sh\'daar, the driving technologies of transcendent change are anathema and must be obliterated from the universe—along with those who would employ them. As their great warships destroy everything in their path en route to the Sol system, the human Confederation government falls into dangerous disarray. There is but one hope, and it rests with a rogue Navy Admiral, commander of the kilometer-long star carrier America, as he leads his courageous fighters deep into enemy space towards humankind\'s greatest conflict—and quite possibly its last.</p>',
                    tags:
                        [ 'Fiction - Science Fiction',
                            'American Science Fiction And Fantasy',
                            'Space warfare',
                            'Science Fiction - Military',
                            'Fiction',
                            'Science Fiction',
                            'Science Fiction - General',
                            'Human-Alien Encounters',
                            'Adventure',
                            'Military',
                            'General',
                            'Science Fiction And Fantasy' ],
                    title: 'Earth Strike',
                    user_categories: {},
                    user_metadata: {} }
            };
            var context={};
            function callback(ctx, data){
                should.not.exist(ctx)
                data.id.should.exist
                done()
            }
            bookHandler.create(event, context, callback)
        })
    });


    describe('#find()', function () {
        var token;
        var user_id;
        var book_id;
        before(function(done){
            var user = {
                "name": 'testplan',
                "plan": 'none',
                "email": 'book-find@example.com',
                "password_hash": 'testplanhash',
                "catalog_token": 'testplancatalog'
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
                        credential_id: 'find-book-credential-id',
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
                        .then(function(book_data){
                            book_id = book_data.id;
                            book.storage_identifier = 'storage-id/test/4';
                            return DBService.createBook(DBSchemas.Book(book))
                        })
                        .then(function(){})
                })
                .then(done, done);
        });

        it('should correctly find specific book in db', function (done) {
            var event={
                token: token,
                path: {},
                query: {
                    id: book_id
                },
                body:{}
            };
            var context={};
            function callback(ctx, data){
                should.not.exist(ctx)
                data.storage_identifier.should.eql('storage-id/test/3')
                done()
            }
            bookHandler.find(event, context, callback)
        })

        it('should correctly find all books from db', function (done) {
            var event={
                token: token,
                path: {},
                query: {},
                body:{}
            };
            var context={};
            function callback(ctx, data){
                should.not.exist(ctx)
                data.Items.length.should.eql(4)
                done()
            }
            bookHandler.find(event, context, callback)
        })
    })

    describe('#destroy()', function () {
        var token;
        var user_id;
        var book_id;
        before(function(done){
            var user = {
                "name": 'testplan',
                "plan": 'none',
                "email": 'book-delete@example.com',
                "password_hash": 'testplanhash',
                "catalog_token": 'testplancatalog'
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
                        credential_id: 'delete-book-credential-id',
                        storage_size: 123456,
                        storage_identifier: 'storage-id/test/1',
                        storage_filename: 'book',
                        storage_format: 'epub',
                        title: 'this is my book title'
                    };
                    return DBService.createBook(DBSchemas.Book(book))
                        .then(function(book_data){
                            book_id = book_data.id;
                        })
                })
                .then(done, done);
        });

        it('should return an error if book id is not specified', function (done) {
            var event={
                token: token,
                path: {},
                query: {},
                body:{}
            };
            var context={};
            function callback(ctx, data){
                JSON.parse(ctx).message.should.exist;
                should.not.exist(data);
                done()
            }
            bookHandler.destroy(event, context, callback)
        })

        it('should correctly delete a book from the db', function (done) {
            var event={
                token: token,
                path: {id:book_id},
                query: {},
                body:{}
            };
            var context={};
            function callback(ctx, data){
                should.not.exist(ctx)
                data.should.eql({})
                done()
            }
            bookHandler.destroy(event, context, callback)
        })


    })
});

