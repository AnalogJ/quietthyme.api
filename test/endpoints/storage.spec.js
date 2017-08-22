var storageHandler = require('../../src/storage');
var DBService = require('../../src/services/db_service');
var JWTTokenService = require('../../src/services/jwt_token_service');
var should = require('should');

describe('Storage Endpoints', function() {
  var token;
  var user_id;
  var credential_id;
  before(function(done) {
    var user = {
      name: 'testplan',
      plan: 'none',
      email: 'storage-link@example.com',
      password_hash: 'testplanhash',
      catalog_token: 'testplancatalog',
    };
    DBService.createUser(user)
      .then(function(user_data) {
        user_id = user_data.uid;
        return JWTTokenService.issue({
          uid: user_data.uid,
          plan: user_data.plan,
          catalog_token: user_data.catalog_token,
          name: user_data.name,
          email: user_data.email,
        });
      })
      .then(function(_token) {
        token = _token;
      })
      .then(done, done);
  });

  describe('#link() @nock', function() {
    it('should correctly initialize a new storage account & credential', function(
      done
    ) {
      var event = {
        token: token,
        path: {},
        query: { source: 'calibre' },
        body: {
          account: {
            service: 'dropbox',
            id: 231987328,
            account: 'storage-link@example.com',
            oauth: {},
          },
        },
      };
      var context = {};
      function callback(ctx, data) {
        should.not.exist(ctx);
        data.should.eql({ service_type: 'dropbox' });

        //TODO: test that the credential that we created has the updated folder data.

        DBService.findCredentialByServiceId('231987328')
          .then(function(cred_data) {
            cred_data.root_folder.id.should.exist;
            cred_data.library_folder.id.should.exist;
            cred_data.blackhole_folder.id.should.exist;
          })
          .then(done, done);
      }
      storageHandler.link(event, context, callback);
    });
  });

  describe('#status() @nock', function() {
    it('should correctly retrieve storage services status from user', function(
      done
    ) {
      var event = {
        token: token,
        path: {},
        query: {},
        body: {},
      };
      var context = {};
      function callback(ctx, data) {
        should.not.exist(ctx);

        /*

                storage_id (credential_id) changes with each run.

                 [{
                 device_name: 'dropbox',
                 prefix: 'dropbox://',
                 storage_type: 'dropbox',
                 storage_id: 'eb67e018-cf5e-4090-a0c5-94435eeee2db',
                 free_space: 13068452798,
                 total_space: 25197281280,
                 location_code: undefined
                 }]

                 */

        data[0].device_name.should.eql('dropbox');
        data[0].prefix.should.eql('dropbox://');
        data[0].free_space.should.eql(13068452798);
        data[0].total_space.should.eql(25197281280);

        done();
      }
      storageHandler.status(event, context, callback);
    });
  });

  describe('#prepare_book()', function() {
    var book_id;
    var credential_id;
    before(function(done) {
      var credential = {
        user_id: user_id,
        service_type: 'google',
        service_id: 'google-service',
        email: 'test2@test.com',
        oauth: { test: 'TEst' },
      };
      DBService.createCredential(credential)
        .then(function(credential_resp) {
          credential_id = credential_resp.id;

          var book = {
            user_id: user_id,
            credential_id: credential_id,
            storage_size: 123456,
            storage_identifier: 'storage-id/test/1234',
            storage_filename: 'book',
            storage_format: 'epub',
            title: 'this is my book title',
          };
          return DBService.createBook(book);
        })
        .then(function(book_data) {
          book_id = book_data.id;
        })
        .then(done, done);
    });

    it('should correctly generate signed url for uploading book file to S3', function(
      done
    ) {
      var event = {
        token: token,
        path: {},
        query: { source: 'calibre' },
        body: {
          storage_id: credential_id,
          book_id: book_id,
          storage_size: 123456,
          storage_filename: 'testbook',
          storage_format: 'epub',
        },
      };
      var context = {};
      function callback(ctx, data) {
        should.not.exist(ctx);

        /*
                *
                * {
                 book_data: {
                 credential_id: '7dac915f-8c46-4155-b653-e7d79a327d39',
                 storage_type: 'quietthyme',
                 storage_identifier: 'quietthyme-api-test-upload/4c4cc2af3882d69b0e28902939e7cd54/18a6aa38-834b-4d10-80fd-2f2f685a09b1/7dac915f-8c46-4155-b653-e7d79a327d39/3d26b848-35e6-4785-bceb-eb42ff21a713/testbookepub',
                 storage_size: 123456,
                 storage_filename: 'testbook',
                 storage_format: 'epub',
                 updated_at: '2017-06-26T01:32:48Z'
                 },
                 upload_url: 'http://quietthyme-api-test-upload.localhost:6001/4c4cc2af3882d69b0e28902939e7cd54/18a6aa38-834b-4d10-80fd-2f2f685a09b1/7dac915f-8c46-4155-b653-e7d79a327d39/3d26b848-35e6-4785-bceb-eb42ff21a713/testbookepub?AWSAccessKeyId=test&Expires=1498440828&Signature=aQAcH9Du%2BTGANUoRJ0O2krjTh5A%3D'
                 }
                * */

        data.book_data.credential_id.should.eql(credential_id);
        data.book_data.storage_type.should.eql('quietthyme');
        data.book_data.storage_identifier.should.exist;
        data.upload_url.should.exist;

        done();
      }
      storageHandler.prepare_book(event, context, callback);
    });
  });
  describe('#prepare_cover()', function() {
    var book_id;
    var credential_id;
    before(function(done) {
      var credential = {
        user_id: user_id,
        service_type: 'google',
        service_id: 'google-service',
        email: 'test2@test.com',
        oauth: { test: 'TEst' },
      };
      DBService.createCredential(credential)
        .then(function(credential_resp) {
          credential_id = credential_resp.id;

          var book = {
            user_id: user_id,
            credential_id: credential_id,
            storage_size: 123456,
            storage_identifier: 'storage-id/test/1234',
            storage_filename: 'book',
            storage_format: 'epub',
            title: 'this is my book title',
          };
          return DBService.createBook(book);
        })
        .then(function(book_data) {
          book_id = book_data.id;
        })
        .then(done, done);
    });

    it('should correctly generate signed url for uploading cover file to S3', function(
      done
    ) {
      var event = {
        token: token,
        path: {},
        query: { source: 'calibre' },
        body: {
          book_id: book_id,
          filename: 'testcover',
          format: 'jpeg',
        },
      };
      var context = {};
      function callback(ctx, data) {
        should.not.exist(ctx);

        data.book_data.cover.should.exist;
        data.upload_url.should.exist;

        done();
      }
      storageHandler.prepare_cover(event, context, callback);
    });
  });
  describe.skip('#download()', function() {});
});
