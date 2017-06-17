var should = require('should');
var StorageService = require('../../src/services/storage_service')

//this is just simple integration testing
describe.skip('StorageService', function () {
    var user;
    before(function (done) {
        User.create({
            name:'test_user'
        }).then(function(test_user){
            return User.findOne(test_user.id)
        }).then(function(test_user){
            user = test_user;
            done();
        })
    });

    describe('#get_url_for_storage_identifier()', function(){
        it('Should return nothing if empty identifier', function () {
            StorageService.get_url_for_storage_identifier(user.storage_container,'').should.eql('')
        });
        it('Should return full file url', function () {
            StorageService.get_url_for_storage_identifier(user.storage_container,'image/test.jpeg')
                .should.eql('https://quietthymetest.blob.core.windows.net/'+user.storage_container+'/image/test.jpeg')
        });
    })

    describe('#create_storage_identifier_from_filename()', function(){
        it('Should create image storage_identifier', function () {
            StorageService.create_storage_identifier_from_filename('test.jpeg','image').should.eql('images/test.jpeg')

        });
        it('Should create file storage_identifier', function () {
            StorageService.create_storage_identifier_from_filename('test.jpeg').should.eql('files/test.jpeg')
        });
    })

    describe('#generate_sas_url()', function(){
        it('Should throw an error if missing container', function () {
            should(function(){
                StorageService.generate_sas_url('','image.jpeg',10)
            }).throw();
        });
        it('Should throw an error if missing storage identifier', function () {
            should(function(){
                StorageService.generate_sas_url(user.storage_container,'',10)
            }).throw();
        });
        it('Should throw an error if access period is too large', function () {
            should(function(){
                StorageService.generate_sas_url(user.storage_container,'',40)
            }).throw();
        });
    });

    describe('#destroy_container()', function(){
        it('Should fail if missing container', function(done){
            StorageService.destroy_container('').fail(function(err){
                err.should.be.ok;
            })
                .then(done,done)

        })

        //it('Should destroy container and all content', function(done){
        //    StorageService.destroy_container('testcontainer')
        //        .then(function(container){
        //            container.should.eql('testcontainer');
        //        })
        //        .then(done, done)
        //})
    })

});