var should = require('should');
var MailService = require('../../src/services/mail_service');

//this is just simple integration testing
describe('MailService', function() {
  describe('#welcomeEmail() @nock', function() {
    it('Should send welcome email', function(done) {
      MailService.welcomeEmail('darkmethodz@gmail.com', 'Jason')
        .then(function(){})
        .then(done, done);
    });

    it('Should raise an error if  welcome email', function(done) {
      MailService.welcomeEmail('', 'Jason')
        .fail(function(err) {
          err.should.be.a.Error;
        })
        .then(done, done);
    });
  });

  // describe('#sendEmail() @nock', function() {
  //   it('Should send welcome email', function(done) {
  //     MailService.welcomeEmail('darkmethodz@gmail.com', 'Jason')
  //       .then(function(){})
  //       .then(done, done);
  //   });
  //
  //   it('Should raise an error if  welcome email', function(done) {
  //     MailService.welcomeEmail('', 'Jason')
  //       .fail(function(err) {
  //         err.should.be.a.Error;
  //       })
  //       .then(done, done);
  //   });
  // });
});
