var should = require('should');
var GlobalHandler = require('../../src/common/global_handler');

describe('GlobalHandler', function() {
  describe('processEvent', function() {
    it('should correctly process the lambda event and populate token and convert body if necessary', function() {
      var event = GlobalHandler.processEvent({
        headers: {
          'Authorization': 'JWT my-jwt-token'
        }
      });
      event.token.should.eql('my-jwt-token');
    });

    it('should return an empty token if no Authorization header is present.', function() {
      var event = GlobalHandler.processEvent({
        headers: {
        }
      });
      event.token.should.eql('');
    });

    it('should return an empty token if Authorization header has too many parts', function() {
      var event = GlobalHandler.processEvent({
        headers: {
          'Authorization': 'JWT too-many my-jwt-token'
        }
      });
      event.token.should.eql('');
    });

    it('should correctly parse JSON body if Content-Type = `application/json`', function() {
      var event = GlobalHandler.processEvent({
        headers: {
          'Content-Type': 'application/json'
        },
        body: '{"hello":"world"}'
      });
      event.body.should.eql({hello:'world'});
    });

    it('should not process body if Content-Type != `application/json`', function() {
      var event = GlobalHandler.processEvent({
        headers: {
          'Content-Type': 'application/xml'
        },
        body: '{"hello":"world"}'
      });
      event.body.should.eql('{"hello":"world"}');
    });

    it('should not raise an error if Content-Type = `application/json` and body is not JSON', function() {
      should.throws(function() {
        GlobalHandler.processEvent({
          headers: {
            'Content-Type': 'application/json'
          },
          body: 'testing=formtype'
        });
      })
    });

  });

  describe('standardResponse', function() {
    it('should return standard response for empty object', function () {
      var resp = GlobalHandler.standardResponse({});
      resp.should.eql({
        statusCode: 200,
        headers:{
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin' : "*", // Required for CORS support to work
          "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: "{\"success\":true,\"data\":{}}"
      });
    });

    it('should return standard response for string response', function () {
      var resp = GlobalHandler.standardResponse("testing");
      resp.should.eql({
        statusCode: 200,
        headers:{
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin' : "*", // Required for CORS support to work
          "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: "{\"success\":true,\"data\":\"testing\"}"
      });
    });
  })

  describe('standardErrorResponse', function() {
    it('should return standard error response for basic error', function () {
      var resp = GlobalHandler.standardErrorResponse({message: "testing", code: 400});
      resp.should.eql({
        statusCode: 400,
        headers:{
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin' : "*", // Required for CORS support to work
          "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: "{\"success\":false,\"error\":{\"message\":\"testing\",\"code\":400}}"
      });
    });

    it('should return standard error response with 500 if no code is present', function () {
      var resp = GlobalHandler.standardErrorResponse({message: "testing"});
      resp.should.eql({
        statusCode: 500,
        headers:{
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin' : "*", // Required for CORS support to work
          "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: "{\"success\":false,\"error\":{\"message\":\"testing\"}}"
      });
    });
  })



  describe('wrap', function() {
    it('should wrap a handler and correctly pass successful response to callback', function (done) {
      function callback(err, data) {
        should.not.exist(err);
        data.should.eql({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin' : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
          },
          body: '{"success":true,"data":{"payload":"this is my data"}}'
        })
        done()
      }

      var handler = GlobalHandler.wrap(function(event, context, cb){
        return cb(null, {payload: "this is my data"})
      });

      handler({headers: {}, requestContext: {}}, {awsRequestId: 'request-id'}, callback)
    });

    it('should wrap a handler and correctly pass error response to callback', function (done) {
      function callback(err, data) {
        should.not.exist(err);
        data.should.eql({
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin' : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
          },
          body: '{"success":false,"error":{"payload":"this is my error data"}}'
        })
        done()
      }

      var handler = GlobalHandler.wrap(function(event, context, cb){
        return cb({payload: "this is my error data"}, null)
      });

      handler({headers: {}, requestContext: {}}, {awsRequestId: 'request-id'}, callback)
    });

  })

});
