var should = require('should');
var nconf = require('../../src/common/nconf');

describe('nconf', function() {
  describe('default environment', function() {
    it('should correctly populate nconf object with test stage', function() {
      nconf.get('STAGE').should.eql('test');
      nconf.get('DEPLOY_SHA').should.eql('test12345');
    });
  });
});
