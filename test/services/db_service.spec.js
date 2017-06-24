var should = require('should');
var DBService = require('../../src/services/db_service')
var DBSchemas = require('../../src/common/db_schemas')

//this is just simple integration testing
describe('DBService', function () {
    describe('#listTables()', function(){
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


    describe('#createUser()', function(){
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

            DBService.createUser(DBSchemas.User(user))
                .then(function (userresp) {
                    should.exist(userresp.uid);
                    userresp.name.should.eql('test1');
                    userresp.email.should.eql('test1@example.com');
                    userresp.catalog_token.should.eql('lousing-bobwhite-angled-augers');
                    userresp.plan.should.eql('none');
                    userresp.library_uuid.should.eql('');
                })

                .then(done, done);
        })
    });


    describe('#updateUserPlan()', function(){
        before(function(done){
            var user = {
                "name": 'testplan',
                "email": 'testplan@example.com',
                "password_hash": 'testplanhash',
                "catalog_token": 'testplancatalog'
            };
            DBService.createUser(DBSchemas.User(user))
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

    describe('#findUserById()', function(){
        var uid;
        before(function(done){
            var user = {
                "name": 'testid',
                "email": 'testid@example.com',
                "password_hash": 'testidhash',
                "catalog_token": 'testidcatalog'
            };
            DBService.createUser(DBSchemas.User(user))
                .then(function(user_data){
                    uid = user.uid
                })
                .then(done, done);
        });
        it('should correctly find user', function (done) {

            DBService.findUserById(uid)
                .then(function(user){
                    user.uid.should.eql(uid)
                    user.plan.should.eql('none');
                    user.email.should.eql('testid@example.com');
                    should.exist(user.uid);
                    // should.not.exist(user.password_hash);
                    // should.not.exist(user.stripe_sub_id);
                })
                .then(done, done);
        });

        it('should return null when user does not exist', function (done) {

            DBService.findUserById('doesnotexist')
                .then(function(user){
                    should.not.exist(user);
                })
                .then(done, done);
        });

        it('should raise an error when user id is null', function (done) {
            DBService.findUserById('')
                .fail(function(error){
                    error.should.be.an.Error
                })
                .then(done, done);
        });
    });

    describe('#findUserByEmail()', function(){
        before(function(done){
            var user = {
                "name": 'test2',
                "email": 'test2@example.com',
                "password_hash": 'test2hash',
                "catalog_token": 'test2catalog'
            };
            DBService.createUser(DBSchemas.User(user))
                .then(function(){})
                .then(done, done);
        });
        it('should correctly find user', function (done) {

            DBService.findUserByEmail('test2@example.com')
                .then(function(user){
                    user.plan.should.eql('none');
                    user.email.should.eql('test2@example.com');
                    should.exist(user.uid);
                    // should.not.exist(user.password_hash);
                    // should.not.exist(user.stripe_sub_id);
                })
                .then(done, done);
        });
        it('should return null when user does not exist', function (done) {

            DBService.findUserByEmail('doesnotexist@example.com')
                .then(function(user){
                    should.not.exist(user);
                })
                .then(done, done);
        });
        it('should raise an error when user email is null', function (done) {
            DBService.findUserByEmail('')
                .fail(function(error){
                    error.should.be.an.Error
                })
                .then(done, done);
        });
    });

    describe('#findUserByCatalogToken()', function(){
        before(function(done){
            var user = {
                "name": 'test3',
                "email": 'test3@example.com',
                "password_hash": 'test3hash',
                "catalog_token": 'test3catalog'
            };
            DBService.createUser(DBSchemas.User(user))
                .then(function(){})
                .then(done, done);
        });
        it('should correctly findUser', function (done) {
            DBService.findUserByCatalogToken('test3catalog')
                .then(function(user){
                    user.plan.should.eql('none');
                    user.email.should.eql('test3@example.com');
                    should.exist(user.uid);
                    // should.not.exist(user.password_hash);
                    // should.not.exist(user.stripe_sub_id);
                })
                .then(done, done);
        });
        it('should return null when user does not exist', function (done) {

            DBService.findUserByCatalogToken('doesnotexist')
                .then(function(user){
                    should.not.exist(user);
                })
                .then(done, done);
        });
        it('should raise an error when user email is null', function (done) {
            DBService.findUserByCatalogToken('')
                .fail(function(error){
                    error.should.be.an.Error
                })
                .then(done, done);
        });
    });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Credential Table Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    describe('#createCredential()', function(){
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

    describe('#findCredentialById()', function(){
        var credential_id;
        before(function(done){
            DBService.createCredential(DBSchemas.Credential({
                "user_id": 'user-id',
                "service_type": 'dropbox',
                "service_id": '12345',
                "email": 'test@test.com',
                "oauth": {"test": "TEst"}
            }))
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

        it('should raise an error when credential id is null', function (done) {
            DBService.findCredentialById('')
                .fail(function(error){
                    error.should.an.Error
                })
                .then(done, done);
        });

    });

    describe('#findCredentialByServiceId()', function(){
        var credential_id;
        before(function(done){
            DBService.createCredential(DBSchemas.Credential({
                "user_id": 'user-service-id',
                "service_type": 'dropbox',
                "service_id": 'service-id-1234',
                "email": 'test@test.com',
                "oauth": {"test": "TEst"}
            }))
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

        it('should raise an error when service id is null', function (done) {
            DBService.findCredentialByServiceId('')
                .fail(function(error){
                    error.should.an.Error
                })
                .then(done, done);
        });
    });

    describe('#findCredentialsByUserId()', function(){
        before(function(done){
            DBService.createCredential(DBSchemas.Credential({
                "user_id": 'user-cred-query-id',
                "service_type": 'dropbox',
                "service_id": 'service-id-1234',
                "email": 'test@test.com',
                "oauth": {"test": "TEst"}
            }))
                .then(function(){
                    return DBService.createCredential(DBSchemas.Credential({
                        "user_id": 'user-cred-query-id',
                        "service_type": 'dropbox',
                        "service_id": 'service-id-1234',
                        "email": 'test@test.com',
                        "oauth": {"test": "TEst"}
                    }))
                })
                .then(function(){
                    return DBService.createCredential(DBSchemas.Credential({
                        "user_id": 'user-cred-query-id',
                        "service_type": 'dropbox',
                        "service_id": 'service-id-1234',
                        "email": 'test@test.com',
                        "oauth": {"test": "TEst"}
                    }))
                })
                .then(function(){})
                .then(done, done);
        });
        it('should correctly find credential', function (done) {
            DBService.findCredentialsByUserId('user-cred-query-id')
                .then(function(credentials){
                    credentials.length.should.eql(3);
                    credentials[0].user_id.should.eql('user-cred-query-id');
                    credentials[0].service_type.should.eql('dropbox');
                    credentials[0].service_id.should.eql('service-id-1234');
                    credentials[0].email.should.eql('test@test.com');
                })
                .then(done, done);
        });

        it('should raise an error when user id is null', function (done) {
            DBService.findCredentialsByUserId('')
                .fail(function(error){
                    error.should.an.Error
                })
                .then(done, done);
        });
    });

    describe('#updateCredential()', function(){
        var credential_id;
        before(function(done){
            DBService.createCredential(DBSchemas.Credential({
                "user_id": 'user-id',
                "service_type": 'dropbox',
                "service_id": '12345',
                "email": 'test@test.com',
                "oauth": {"test": "TEst"}
            }))
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


    describe('#createBook()', function(){
        it('should correctly create book', function (done) {
            var book = {
                user_id: 'user-id',
                credential_id: 'credential-create-id',
                storage_size: 123456,
                storage_identifier: 'storage-id/test/1234',
                storage_filename: 'book',
                storage_format: 'epub',
                title: 'this is my book title'
            };
            DBService.createBook(DBSchemas.Book(book))
                .then(function(book_data){
                    book_data.user_id.should.eql('user-id')
                })
                .then(done, done);
        });
    });

    describe('#findBookById()', function(){
        var book_id;
        before(function(done){
            var book = {
                user_id: 'user-id',
                credential_id: 'credential-create-id',
                storage_size: 123456,
                storage_identifier: 'storage-id/test/1234',
                storage_filename: 'book',
                storage_format: 'epub',
                title: 'this is my book title'
            };
            DBService.createBook(DBSchemas.Book(book))
                .then(function(book_data){
                    book_id = book_data.id;
                })
                .then(done, done);
        });
        it('should correctly find book', function (done) {
            DBService.findBookById(book_id, 'user-id')
                .then(function(book_data){
                    book_data.user_id.should.eql('user-id');
                    book_data.id.should.eql(book_id);
                    // should.not.exist(user.password_hash);
                    // should.not.exist(user.stripe_sub_id);
                })
                .then(done, done);
        });

        it('should raise an error when book id is null', function (done) {
            DBService.findBookById('')
                .fail(function(error){
                    error.should.an.Error
                })
                .then(done, done);
        });
    });

    describe('#findBooksByUserId()', function(){
        before(function(done){
            var book = {
                user_id: 'find-book-user-id',
                credential_id: 'credential-create-id',
                storage_size: 123456,
                storage_identifier: 'storage-id/test/1234',
                storage_filename: 'book',
                storage_format: 'epub',
                title: 'this is my book title'
            };
            DBService.createBook(DBSchemas.Book(book))
                .then(function(){
                    return DBService.createBook(book)
                })
                .then(function(){
                    return DBService.createBook(book)
                })
                .then(function(){})
                .then(done, done);
        });
        it('should correctly find book', function (done) {
            DBService.findBooksByUserId('find-book-user-id')
                .then(function(resp_data){
                    resp_data.Items.length.should.eql(3);
                })
                .then(done, done);
        });

        it('should raise an error when user id is null', function (done) {
            DBService.findBooksByUserId('')
                .fail(function(error){
                    error.should.an.Error
                })
                .then(done, done);
        });
    });

    describe('#findBooks()', function(){
        before(function(done){
            var book1 = {
                user_id: 'find-book',
                credential_id: 'credential-create-id',
                storage_size: 123456,
                storage_identifier: 'storage-id/test/1',
                storage_filename: 'book2',
                storage_format: 'epub',
                title: 'title1'
            };
            var book2 = {
                user_id: 'find-book',
                credential_id: 'credential-create-id',
                storage_size: 123456,
                storage_identifier: 'storage-id/test/2',
                storage_filename: 'book1',
                storage_format: 'pdf',
                title: 'title2'
            };
            var book3 = {
                user_id: 'find-book',
                credential_id: 'credential-create-id',
                storage_size: 123456,
                storage_identifier: 'storage-id/test/3',
                storage_filename: 'book2',
                storage_format: 'pdf',
                title: 'title3'
            };
            var book4 = {
                user_id: 'find-book',
                credential_id: 'credential-create-id',
                storage_size: 123456,
                storage_identifier: 'storage-id/test/4',
                storage_filename: 'book1',
                storage_format: 'epub',
                title: 'title4'
            };
            DBService.createBook(DBSchemas.Book(book1))
                .then(function(){

                    return DBService.createBook(book2)
                })
                .then(function(){
                    return DBService.createBook(book3)
                })
                .then(function(){
                    return DBService.createBook(book4)
                })
                .then(function(){})
                .then(done, done);
        });
        it('should correctly find book after filtering', function (done) {
            DBService.findBooks('find-book', {'storage_format': 'pdf'})
                .then(function(resp_data){
                    resp_data.Items.length.should.eql(2);
                })
                .then(function(){
                    return DBService.findBooks('find-book', {'title': 'title4'})
                })
                .then(function(resp_data){
                    resp_data.Items.length.should.eql(1);
                })
                .then(done, done);
        });

        it('should correctly handle empty filter', function (done) {
            DBService.findBooks('find-book', {})
                .then(function(resp_data){
                    resp_data.Items.length.should.eql(4);
                })
                .then(done, done);
        });

        it('should correctly handle multiple filters', function (done) {
            DBService.findBooks('find-book', {'storage_format': 'pdf', 'storage_identifier': 'storage-id/test/2', 'storage_filename': 'book1'})
                .then(function(resp_data){
                    resp_data.Items.length.should.eql(1);
                })
                .then(done, done);
        });

        it('should correctly paginate with page limits', function (done) {

            var found_items = [];
            function paginate(resp_data){
                found_items = found_items.concat(resp_data.Items)
                if(resp_data.LastEvaluatedKey){
                    return DBService.findBooks('find-book', {'storage_filename': 'book2'}, resp_data.LastEvaluatedKey.id, 1)
                        .then(paginate)
                }
                else{
                    return found_items
                }
            }

            DBService.findBooks('find-book', {'storage_filename': 'book2'}, null, 1)
                .then(paginate)
                .then(function(items){
                    items.length.should.eql(2);
                })
                .then(done, done);
        });

        it('should raise an error when user id is null', function (done) {
            DBService.findBooks('')
                .fail(function(error){
                    error.should.an.Error
                })
                .then(done, done);
        });
    });

    describe('#updateBook()', function(){
        var book_id;
        before(function(done){
            var book = {
                user_id: 'update-user-id',
                credential_id: 'credential-create-id',
                storage_size: 123456,
                storage_identifier: 'storage-id/test/1234',
                storage_filename: 'book',
                storage_format: 'epub',
                title: 'this is my book title'
            };
            DBService.createBook(DBSchemas.Book(book))
                .then(function(book_data){
                    book_id = book_data.id;
                })
                .then(done, done);
        });
        it('should correctly update book', function (done) {
            DBService.updateBook(book_id,'update-user-id', {storage_filename: 'updated_book_filename'})
                .then(function(book){
                    book.should.eql({});
                })
                .then(done, done);
        });

        it('should correctly update book and return values', function (done) {
            DBService.updateBook(book_id,'update-user-id', {storage_filename: 'updated_book_filename_2'}, true)
                .then(function(book){
                    book.storage_filename.should.eql('updated_book_filename_2');
                })
                .then(done, done);
        });
    });

    describe('#deleteBookById()', function(){
        var book_id;
        before(function(done){
            var book = {
                user_id: 'book-delete-user-id',
                credential_id: 'book-delete-credential-id',
                storage_size: 123456,
                storage_identifier: 'storage-id/test/1234',
                storage_filename: 'book',
                storage_format: 'epub',
                title: 'this is my book title'
            };
            DBService.createBook(DBSchemas.Book(book))
                .then(function(book_data){
                    book_id = book_data.id;
                })
                .then(done, done);
        });
        it('should correctly delete book', function (done) {
            DBService.deleteBookById(book_id, 'book-delete-user-id')
                .then(function(book_data){
                    book_data.should.eql({});
                })
                .then(done, done);
        });

        it('should raise an error when book id is null', function (done) {
            DBService.deleteBookById('')
                .fail(function(error){
                    error.should.an.Error
                })
                .then(done, done);
        });
    });

})