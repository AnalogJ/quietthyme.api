var catalogHandler = require('../../src/catalog');
var DBService = require('../../src/services/db_service');
var JWTTokenService = require('../../src/services/jwt_token_service');
var Base64Service = require('../../src/services/base64_service');
var should = require('should');
var q = require('q');
var path = require('path');
var fs = require('fs');

describe('Catalog Endpoints', function() {
  var token = 'test-token-catalog';
  var user_id;
  before(function(done) {
    this.timeout(10000);

    var user = {
      name: 'testplan',
      plan: 'none',
      email: 'catalog-books@example.com',
      password_hash: 'testplanhash',
      catalog_token: token,
    };

    DBService.createUser(user)
      .then(function(user_data) {
        user_id = user_data.uid;

        var books_file = path.resolve(
          path.resolve(__dirname, '../fixtures/100_books.json')
        );
        var fake_books = JSON.parse(fs.readFileSync(books_file, 'utf8'));
        var promises = [];
        for (var ndx in fake_books) {
          var fake_book = fake_books[ndx];

          fake_book.user_id = user_id;
          fake_book.credential_id = 'catalog-credential-id';
          promises.push(DBService.createBook(fake_book));
        }

        return q.allSettled(promises);
      })
      .then(function(promises) {
        var failed = []
        for(let promise of promises){
          if(promise.state != 'fulfilled'){
            failed << promise;
          }
        }

        if(failed.length >0){
          console.error("Could not insert the following books")
          console.error(failed)
          throw "Could not populate books. look above for exact errors"
        }
      })
      // .delay(1000)
      .then(done, done);
  });

  describe('#index()', function() {
    it('should correctly retrieve catalog index', function(done) {
      var event = {
        pathParameters: { catalogToken: token },
        queryStringParameters: {},
        body: {},
      };
      var context = {};
      function callback(ctx, data) {
        should.not.exist(ctx);
        data.should.be.a.String;
        done();
      }
      catalogHandler.index(event, context, callback);
    });
  });

  describe('#series()', function() {});
  describe('#books()', function() {
    it('should correctly generate books catalog', function(done) {
      var event = {
        pathParameters: { catalogToken: token },
        queryStringParameters: {},
        body: {},
      };
      var context = {};
      function callback(ctx, data) {
        should.not.exist(ctx);
        data.should.be.a.String;
        done();
      }
      catalogHandler.books(event, context, callback);
    });
  });
  describe('#recent()', function() {
    it('should correctly generate recent catalog', function(done) {
      var event = {
        pathParameters: { catalogToken: token },
        queryStringParameters: {},
        body: {},
      };
      var context = {};
      function callback(ctx, data) {
        should.not.exist(ctx);
        data.should.be.a.String;
        done();
      }
      catalogHandler.recent(event, context, callback);
    });
  });

  describe('#seriesid()', function() {
    it('should correctly generate seriesid catalog when given a specific seriesId', function(
      done
    ) {
      var event = {
        pathParameters: {
          catalogToken: token,
          seriesId: Base64Service.urlEncode("Bedfordshire tan"),
        },
        queryStringParameters: {},
        body: {},
      };
      var context = {};
      function callback(ctx, data) {
        should.not.exist(ctx);
        data.should.be.a.String;
        done();
      }
      catalogHandler.seriesid(event, context, callback);
    });
  });

  describe('#authorid()', function() {
    it('should correctly generate author catalog when given a specific authorId', function(
      done
    ) {
      var event = {
        pathParameters: {
          catalogToken: token,
          authorId: Base64Service.urlEncode('Hollie Hackett'),
        },
        queryStringParameters: {},
        body: {},
      };
      var context = {};
      function callback(ctx, data) {
        should.not.exist(ctx);
        data.should.be.a.String;
        done();
      }
      catalogHandler.authorid(event, context, callback);
    });
  });

  describe('#tagname()', function() {
    it('should correctly generate tag catalog when given a specific tagname', function(
      done
    ) {
      var event = {
        pathParameters: {
          catalogToken: token,
          tagName: Base64Service.urlEncode('attitude AGP'),
        },
        queryStringParameters: {},
        body: {},
      };
      var context = {};
      function callback(ctx, data) {
        should.not.exist(ctx);
        data.should.be.a.String;
        done();
      }
      catalogHandler.tagname(event, context, callback);
    });
  });

  describe('#search_definition()', function() {});

  describe('#search()', function() {});

  describe.skip('#book()', function() {
    it('should correctly generate book details catalog when given a specific book_id', function(
      done
    ) {
      var event = {
        pathParameters: {
          catalogToken: token,
          bookId: '',
        },
        queryStringParameters: {},
        body: {},
      };
      var context = {};
      function callback(ctx, data) {
        should.not.exist(ctx);
        data.should.be.a.String;
        done();
      }
      catalogHandler.book(event, context, callback);
    });
  });

  describe.skip('#download()', function() {});
});
