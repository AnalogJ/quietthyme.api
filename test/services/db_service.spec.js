var should = require('should');
var DBService = require('../../src/services/db_service')
var DBSchemas = require('../../src/common/db_schemas')

//this is just simple integration testing
describe('DBService', function () {
    describe('listTables', function(){
        it('should correctly list all tables', function (done) {
            DBService.listTables()
                .then(function(tables){
                    tables.should.eql([
                        'quietthyme-api-test-books',
                        'quietthyme-api-test-credentials',
                        'quietthyme-api-test-users'
                    ] )
                })
                .then(done, done);
        })
    });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// User Table Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    describe('createUser', function(){
        it('should correctly createUser', function (done) {
            var user = {
                name: 'test1',
                email: 'test1@example.com',
                password_hash: '$2a$10$deIH248Ql0zPgy1qGz8LhOdC6rVimyXwxzPPcmbqvsIv9p5wkm2L6',
                catalog_token: 'lousing-bobwhite-angled-augers',
                plan: 'none',
                library_uuid: '',
                stripe_sub_id: ''
            };
            DBSchemas.User(user);
            DBService.createUser(user)
                .then(function (userresp) {
                    should.exist(userresp.user_id);
                    userresp.name.should.eql('test1');
                    userresp.email.should.eql('test1@example.com');
                    userresp.catalog_token.should.eql('lousing-bobwhite-angled-augers');
                    userresp.plan.should.eql('none');
                    userresp.library_uuid.should.eql('');
                })

                .then(done, done);
        })
    });


    describe('updateUserPlan', function(){
        before(function(done){
            var user = {
                "name": 'testplan',
                "email": 'testplan@example.com',
                "password_hash": 'testplanhash',
                "catalog_token": 'testplancatalog'
            };
            user = DBSchemas.User(user);
            DBService.createUser(user)
                .then(function(){})
                .then(done, done);
        });
        it('should correctly update user plan', function (done) {

            DBService.updateUserPlan('test-uuid-plan', 'basic', 'subscriptionid1')
                .then(function(resp){
                    resp.should.eql({})
                })
                .then(done, done);
        });
    });

    describe('findUserById', function(){
        var user_id;
        before(function(done){
            var user = {
                "name": 'testid',
                "email": 'testid@example.com',
                "password_hash": 'testidhash',
                "catalog_token": 'testidcatalog'
            };
            user = DBSchemas.User(user);
            DBService.createUser(user)
                .then(function(user_data){
                    user_id = user.user_id
                })
                .then(done, done);
        });
        it('should correctly find user', function (done) {

            DBService.findUserById(user_id)
                .then(function(user){
                    user.user_id.should.eql(user_id)
                    user.plan.should.eql('none');
                    user.email.should.eql('testid@example.com');
                    should.exist(user.user_id);
                    // should.not.exist(user.password_hash);
                    // should.not.exist(user.stripe_sub_id);
                })
                .then(done, done);
        });
    });

    describe('findUserByEmail', function(){
        before(function(done){
            var user = {
                "name": 'test2',
                "email": 'test2@example.com',
                "password_hash": 'test2hash',
                "catalog_token": 'test2catalog'
            };
            user = DBSchemas.User(user);
            DBService.createUser(user)
                .then(function(){})
                .then(done, done);
        });
        it('should correctly find user', function (done) {

            DBService.findUserByEmail('test2@example.com')
                .then(function(user){
                    user.plan.should.eql('none');
                    user.email.should.eql('test2@example.com');
                    should.exist(user.user_id);
                    // should.not.exist(user.password_hash);
                    // should.not.exist(user.stripe_sub_id);
                })
                .then(done, done);
        });
    });

    describe('findUserByCatalogToken', function(){
        before(function(done){
            var user = {
                "name": 'test3',
                "email": 'test3@example.com',
                "password_hash": 'test3hash',
                "catalog_token": 'test3catalog'
            };
            user = DBSchemas.User(user);
            DBService.createUser(user)
                .then(function(){})
                .then(done, done);
        });
        it('should correctly findUser', function (done) {
            DBService.findUserByCatalogToken('test3catalog')
                .then(function(user){
                    user.plan.should.eql('none');
                    user.email.should.eql('test3@example.com');
                    should.exist(user.user_id);
                    // should.not.exist(user.password_hash);
                    // should.not.exist(user.stripe_sub_id);
                })
                .then(done, done);
        });
    });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Credential Table Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    describe('createCredential', function(){
        it('should correctly create credential', function (done) {
            var credential = {
                "user_id": "123-456-789",
                "service_type": 'dropbox',
                "service_id": '12345',
                "email": 'test@test.com',
                "oauth": {"test":"TEst"}
            };
            DBService.createCredential(DBSchemas.Credential(credential))
                .then(function(credential_resp){
                    should.exist(credential_resp.id)
                    credential_resp.user_id.should.eql("123-456-789");
                    credential_resp.service_type.should.eql('dropbox');
                    credential_resp.service_id.should.eql('12345');
                    credential_resp.email.should.eql('test@test.com');
                    credential_resp.oauth.should.eql({"test":"TEst"});
                })
                .then(done, done);
        });
    });

    describe('findCredentialById', function(){
        var credential_id;
        before(function(done){
            DBService.createCredential({
                "user_id": 'user-id',
                "service_type": 'dropbox',
                "service_id": '12345',
                "email": 'test@test.com',
                "oauth": {"test": "TEst"}
            })
                .then(function(credential_data){
                    credential_id = credential_data.id;
                })
                .then(done, done);
        });
        it('should correctly find credential', function (done) {
            DBService.findCredentialById(credential_id)
                .then(function(credential){
                    credential.user_id.should.eql('user-id');
                    credential.id.should.eql(credential_id);
                    // should.not.exist(user.password_hash);
                    // should.not.exist(user.stripe_sub_id);
                })
                .then(done, done);
        });

        it('should correctly find credential if user_id is specified', function (done) {
            DBService.findCredentialById(credential_id, 'user-id')
                .then(function(credential){
                    credential.user_id.should.eql('user-id');
                    credential.id.should.eql(credential_id);
                    // should.not.exist(user.password_hash);
                    // should.not.exist(user.stripe_sub_id);
                })
                .then(done, done);
        });

        it('should correctly filter all credential if unknown user_id is specified', function (done) {
            DBService.findCredentialById(credential_id, 'does-not-exist-user-id')
                .then(function(credential){
                    should.not.exist(credential)
                })
                .then(done, done);
        });
    });

    describe('findCredentialByServiceId', function(){
        var credential_id;
        before(function(done){
            DBService.createCredential({
                "user_id": 'user-service-id',
                "service_type": 'dropbox',
                "service_id": 'service-id-1234',
                "email": 'test@test.com',
                "oauth": {"test": "TEst"}
            })
                .then(function(credential_data){
                    credential_id = credential_data.id;
                })
                .then(done, done);
        });
        it('should correctly find credential', function (done) {
            DBService.findCredentialByServiceId('service-id-1234')
                .then(function(credential){
                    credential.user_id.should.eql('user-service-id');
                    credential.id.should.eql(credential_id);
                    // should.not.exist(user.password_hash);
                    // should.not.exist(user.stripe_sub_id);
                })
                .then(done, done);
        });
    });

    describe('updateCredential', function(){
        var credential_id;
        before(function(done){
            DBService.createCredential({
                "user_id": 'user-id',
                "service_type": 'dropbox',
                "service_id": '12345',
                "email": 'test@test.com',
                "oauth": {"test": "TEst"}
            })
                .then(function(credential_data){
                    credential_id = credential_data.id;
                })
                .then(done, done);
        });
        it('should correctly update credential', function (done) {
            DBService.updateCredential(credential_id, {event_cursor: 'event-cursor'})
                .then(function(credential){
                    credential.should.eql({});
                    // should.not.exist(user.password_hash);
                    // should.not.exist(user.stripe_sub_id);
                })
                .then(done, done);
        });

        it('should correctly update credential and return values', function (done) {
            DBService.updateCredential(credential_id, {event_cursor: 'event-cursor-value'}, true)
                .then(function(credential){
                    credential.event_cursor.should.eql('event-cursor-value');
                    // should.not.exist(user.password_hash);
                    // should.not.exist(user.stripe_sub_id);
                })
                .then(done, done);
        });
    });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Book Table Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    describe('createBook', function(){
        it('should correctly create book', function (done) {
            var book = {
                user_id: '70fa84f3-60bc-4cdf-9804-a71b9328edfe',
                name: 'test1',
                email: 'test1@example.com',
                password_hash: '$2a$10$deIH248Ql0zPgy1qGz8LhOdC6rVimyXwxzPPcmbqvsIv9p5wkm2L6',
                catalog_token: 'lousing-bobwhite-angled-augers',
                plan: 'none',
                library_uuid: '',
                stripe_sub_id: ''
            };
            DBSchemas.User(user);
            DBService.createUser(user)
                .then(function(userresp){
                    userresp.should.eql({
                        user_id: '70fa84f3-60bc-4cdf-9804-a71b9328edfe',
                        name: 'test1',
                        email: 'test1@example.com',
                        catalog_token: 'lousing-bobwhite-angled-augers',
                        plan: 'none',
                        library_uuid: '',
                    } )
                })
                .then(done, done);
        });
    });

})