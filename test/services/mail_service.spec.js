var should = require('should');

//this is just simple integration testing
describe.skip('MailService', function() {
  describe.skip('#subscribe()', function() {
    it('Should fail if email address is empty', function(done) {
      //            StorageService.store_file_in_container('',new Buffer(1),'image/jpeg','image/test.jpeg')
      //                .fail(function(err){
      //                    err.should.be.a.Error;
      //                })
      //                .then(done, done);
    });

    it('Should immediately add user to mailing list, without double optin.', function(
      done
    ) {
      //            StorageService.store_file_in_container('testcontainer',null,'image/jpeg','image/test.jpeg')
      //                .fail(function(err){
      //                    err.should.be.a.Error;
      //                })
      //                .then(done, done);
    });
  });
  describe.skip('#unsubscribe()', function() {
    it('Should return nothing if empty email', function() {});
  });

  describe('#send()', function() {
    it('Should fail if no template provided', function(done) {
      var options = {
        to: {
          email: 'test@example.com',
        },
        subject: 'test subject',
      };

      MailService.send(options, null)
        .fail(function(err) {
          err.should.be.a.Error;
        })
        .then(done, done);
    });

    it('Should fail if no `to` email provided', function(done) {
      var options = {
        template: 'welcome',
        subject: 'test subject',
      };

      MailService.send(options, null)
        .fail(function(err) {
          err.should.be.a.Error;
        })
        .then(done, done);
    });
    it('Should fail if no subject provided', function(done) {
      var options = {
        template: 'welcome',
        to: {
          email: 'test@example.com',
        },
      };

      MailService.send(options, null)
        .fail(function(err) {
          err.should.be.a.Error;
        })
        .then(done, done);
    });
    it('Should fail if no email address provided', function(done) {
      var options = {
        template: 'welcome',
      };

      MailService.send(options, null)
        .fail(function(err) {
          err.should.be.a.Error;
        })
        .then(done, done);
    });

    it.skip('Should fail if template data does not match', function(done) {
      var options = {
        template: 'welcome',
        to: {
          email: 'darkmethodz@gmail.com',
        },
        subject: 'test subject',
      };

      MailService.send(options, null)
        .fail(function(err) {
          err.should.be.a.Error;
        })
        .then(done, done);
    });
  });
});
