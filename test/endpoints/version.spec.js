var versionHandler = require('../../src/version');
var should = require('should');

//this is just simple integration testing
describe('Version Endpoint', function() {
  describe('#handler()', function() {
    it('should correctly return version info', function(done) {
      var event = {headers:{}};
      var context = {};
      var callback = function(ctx, data) {
        should.not.exist(ctx);
        data.deploySha.should.eql('test12345');
        done();
      };
      versionHandler.handler(event, context, callback);
    });
  });
});
