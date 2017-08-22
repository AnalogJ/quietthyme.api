var should = require('should');
var Base64Service = require('../../src/services/base64_service');
//this is just simple integration testing
describe('Base64Service', function() {
  describe('#encode()', function() {
    it('should encode correctly', function() {
      Base64Service.encode('').should.eql('');
      Base64Service.encode('f').should.eql('Zg==');
      Base64Service.encode('fo').should.eql('Zm8=');
      Base64Service.encode('foo').should.eql('Zm9v');
      Base64Service.encode('foob').should.eql('Zm9vYg==');
      Base64Service.encode('fooba').should.eql('Zm9vYmE=');
      Base64Service.encode('foobar').should.eql('Zm9vYmFy');
    });
  });
  describe('#decode()', function() {
    it('should decode correctly', function() {
      Base64Service.decode('').should.eql('');
      Base64Service.decode('Zg==').should.eql('f');
      Base64Service.decode('Zm8=').should.eql('fo');
      Base64Service.decode('Zm9v').should.eql('foo');
      Base64Service.decode('Zm9vYg==').should.eql('foob');
      Base64Service.decode('Zm9vYmE=').should.eql('fooba');
      Base64Service.decode('Zm9vYmFy').should.eql('foobar');
    });
  });
  describe('#urlEncode()', function() {
    it('should encode correctly', function() {
      Base64Service.urlEncode('').should.eql('');
      Base64Service.urlEncode('f').should.eql('Zg');
      Base64Service.urlEncode('fo').should.eql('Zm8');
      Base64Service.urlEncode('foo').should.eql('Zm9v');
      Base64Service.urlEncode('foob').should.eql('Zm9vYg');
      Base64Service.urlEncode('fooba').should.eql('Zm9vYmE');
      Base64Service.urlEncode('foobar').should.eql('Zm9vYmFy');
    });
  });
  describe('#urlDecode()', function() {
    it('should decode correctly', function() {
      Base64Service.urlDecode('').should.eql('');
      Base64Service.urlDecode('Zg==').should.eql('f');
      Base64Service.urlDecode('Zm8=').should.eql('fo');
      Base64Service.urlDecode('Zm9v').should.eql('foo');
      Base64Service.urlDecode('Zm9vYg==').should.eql('foob');
      Base64Service.urlDecode('Zm9vYmE=').should.eql('fooba');
      Base64Service.urlDecode('Zm9vYmFy').should.eql('foobar');
    });
  });
});
