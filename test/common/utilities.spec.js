var Utilities = require('../../src/common/utilities');
var should = require('should');

//this is just simple integration testing
describe('Helpers', function() {
  describe('#stripEmpty()', function() {
    it('should correctly strip empty strings from object', function() {
      var data = Utilities.stripEmpty({ test: '', exists: 0 });
      should.not.exist(data.test);
      data.should.eql({ exists: 0 });
    });

    it('should ensure that xml strings are not stripped', function() {
      var data = { short_summary: '<blockquote><p></p>' };
      data.short_summary.should.be.a.String;

      data = Utilities.stripEmpty(data);
      data.short_summary.should.be.a.String;
    });
  });

  describe('#errorHandler()', function() {
    it('should correctly transform a string into an error', function(done) {
      function cb(err) {
        err.should.eql({ message: '[500] this is a test error', code:500 });
        done();
      }
      Utilities.errorHandler(cb, {})('this is a test error');
    });

    it('should correctly handle error objects', function(done) {
      function cb(err) {
        err.should.eql({ message: '[500] this is a test error', code:500 });
        done();
      }
      Utilities.errorHandler(cb, {})(new Error('this is a test error'));
    });

    it('should correctly handle error objects with embedded error codes', function(
      done
    ) {
      function cb(err) {
        err.should.eql({ message: '[401] this is a test error', code:401 });
        done();
      }
      var error = new Error('this is a test error');
      error.code = 401;
      Utilities.errorHandler(cb, {})(error);
    });
  });
});
