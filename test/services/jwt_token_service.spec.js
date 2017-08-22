var should = require('should');
var JWTokenService = require('../../src/services/jwt_token_service');
//this is just simple integration testing
describe('JWTokenService', function() {
  describe('#issue()', function() {
    it('should generate a valid token', function(done) {
      var token = JWTokenService.issue({
        payload: 'data',
      });

      JWTokenService.verify(token)
        .then(function(decoded) {
          decoded.payload.should.be.eql('data');
        })
        .then(done, done);
    });
  });

  describe('#verify()', function() {
    it('should raise an error if decoding an invalid token', function(done) {
      JWTokenService.verify('123456')
        .fail(function(decoded) {
          decoded.should.be.an.Error;
        })
        .then(done, done);
    });
  });
});
