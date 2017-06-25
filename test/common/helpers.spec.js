var Utilities = require('../../src/common/utilities')
var should = require('should');

//this is just simple integration testing
describe('Helpers', function () {
    describe('#errorHandler()', function () {
        it('should correctly transform a string into an error', function (done) {
            function cb(err){
                JSON.parse(err).should.eql({"message":"[400] this is a test error"})
                done()
            }
            Utilities.errorHandler(cb)('this is a test error')
        })

        it('should correctly handle error objects', function (done) {
            function cb(err){
                JSON.parse(err).should.eql({"message":"[400] this is a test error"})
                done()
            }
            Utilities.errorHandler(cb)(new Error('this is a test error'))
        })

        it('should correctly handle error objects with embedded error codes', function (done) {
            function cb(err){
                JSON.parse(err).should.eql({"message":"[500] this is a test error"})
                done()
            }
            var error = new Error('this is a test error')
            error.code = 500
            Utilities.errorHandler(cb)(error)
        })
    })
});