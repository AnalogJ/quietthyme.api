var storageHandler = require('../../src/storage');
var DBService = require('../../src/services/db_service');
var JWTTokenService = require('../../src/services/jwt_token_service');
var DBSchemas = require('../../src/common/db_schemas');
var should = require('should');

describe('Storage Endpoints', function () {
    var token;
    before(function(done){
        var user = {
            "name": 'testplan',
            "plan": 'none',
            "email": 'storage-link@example.com',
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

    describe('#link() @nock', function () {

        it('should correctly initialize a new storage account & credential', function (done) {
            var event={
                token: token,
                path: {},
                query: {source: 'calibre'},
                body:{
                    account: {
                        service:'dropbox',
                        id: 231987328,
                        account: 'storage-link@example.com',
                        oauth: {}
                    }
                }
            };
            var context={};
            function callback(ctx, data){
                should.not.exist(ctx)
                data.should.eql({service_type: 'dropbox'})

                //TODO: test that the credential that we created has the updated folder data.


                DBService.findCredentialByServiceId('231987328')
                    .then(function(cred_data){
                        cred_data.root_folder.id.should.exist;
                        cred_data.library_folder.id.should.exist;
                        cred_data.blackhole_folder.id.should.exist;
                    })
                    .then(done, done)
            }
            storageHandler.link(event, context, callback)
        })
    });

    describe('#status() @nock', function () {

        it('should correctly retrieve storage services status from user', function (done) {
            var event={
                token: token,
                path: {},
                query: {},
                body:{}
            };
            var context={};
            function callback(ctx, data){
                should.not.exist(ctx)

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

                data[0].device_name.should.eql('dropbox')
                data[0].prefix.should.eql('dropbox://')
                data[0].free_space.should.eql(13068452798)
                data[0].total_space.should.eql(25197281280)

                done()
            }
            storageHandler.status(event, context, callback)
        })
    });

    describe.skip('#prepare_book()', function () {});
    describe.skip('#prepare_cover()', function () {});
    describe.skip('#download()', function () {});
});

