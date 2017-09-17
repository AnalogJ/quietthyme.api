var Rollbar = require('rollbar');
var nconf = require('./nconf');
var JwtTokenService = require('../services/jwt_token_service');
const debug = require('debug')('quietthyme:global_handler');
var ua = require('universal-analytics');

//global configuration for every call.
var _rollbar_instances = {}

var _disabled_rollbar = new Rollbar({
  enabled: false
})


var GlobalHandler = module.exports

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Serverless Lambda Proxy
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//populate event.token and convert event.body to JSON if content-type is application/json
GlobalHandler.processEvent = function(event){
  //set sane defaults
  event.token = "";
  event.pathParameters = event.pathParameters || {};
  event.queryStringParameters = event.queryStringParameters || {};


  var authHeader = event.headers['Authorization']|| event.headers['authorization'];
  if(authHeader){
    var authParts = authHeader.split(' ');

    if( authParts.length == 2 ){
      event.token = authParts[1];

      //todo we could set the event.auth object here, so handlers dont need to do it individually. Have to figure out promises
      // first.
    }
  }

  var contentTypeHeader = event.headers['Content-Type'] || event.headers['content-type'];
  if(contentTypeHeader == 'application/json'){
    //process JSON payload
    event.body = JSON.parse(event.body);
  }
  return event
};

GlobalHandler.standardResponse = function(payload){
  if(payload == null){return null}
  return {
    statusCode: 200,
    headers:{
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin' : "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify({success: true, data: payload})
  }
};

GlobalHandler.standardErrorResponse = function(err){
  if(err == null){return null}
  return {
    statusCode: err.code || 500,
    headers:{
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin' : "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify({success: false, error: err})
  }
}

GlobalHandler.catalogResponse = function(payload){
  if(payload == null){return null}
  return {
    statusCode: 200,
    headers:{
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=120'
    },
    body: payload
  }
}

GlobalHandler.catalogErrorResponse = function(err){
  if(err == null){return null}

  return {
    statusCode: 500,
    headers:{
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=120'
    },
    body: err
  }
}

GlobalHandler.redirectResponse = function(redirectData){
  if(redirectData == null){return null}

  return {
    statusCode: 302,
    headers: {
      'Location': redirectData.headers.Location,
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin' : "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify({})
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Google Analytics Handling
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

GlobalHandler.publishGoogleAnalyticsEvent = function(event, context){

  var userData = JwtTokenService.decodeSync(event.token) || {};
  var visitor;
  if(userData.uid){
    visitor = ua(nconf.get('GOOGLE_ANALYTICS_ACCOUNT_ID'), userData.uid, {strictCidFormat: false});
  }
  else{
    visitor = ua(nconf.get('GOOGLE_ANALYTICS_ACCOUNT_ID'));
  }

  visitor.event(`${event.httpMethod}#${event.resource}`, event.path, userData.email || null).send()
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Rollbar Exception Handling
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

GlobalHandler.configureRollbar = function(requestId, payloadData){
  var rollbar = GlobalHandler.getRollbar(requestId);
  rollbar.configure({payload: payloadData}); //TODO: verify that this "MERGES" with the existing payload data, instead of overwriting it.
}

//create an instance of the rollbar object.
GlobalHandler.getRollbar = function(requestId){
  requestId = requestId || 'default';
  if(nconf.get('STAGE') == 'test'){
    return _disabled_rollbar
  }

  if(!_rollbar_instances[requestId]){
    _rollbar_instances[requestId] = new Rollbar({
      accessToken: nconf.get("ROLLBAR_PUSH_API_KEY"),
      captureUncaught: false, //these wildcard captures can only be done by default rolbar.
      captureUnhandledRejections: false, //these wildcard captures can only be done by default rollbar.
      payload: {
        environment: nconf.get('STAGE'),
        client: {
          javascript: {
            code_version: nconf.get('DEPLOY_SHA')
          }
        },
        server: {
          branch: nconf.get('STAGE'),
          host: requestId
        }
      }
    });
    _rollbar_instances[requestId].log(`Initialize rollbar for request ${requestId}`);
  }

  return _rollbar_instances[requestId]
}

// https://rollbar.com/docs/notifier/rollbar.js/#person-tracking
GlobalHandler.rollbarLambdaPayload = function(_event, _context){

  var userData = JwtTokenService.decodeSync(_event.token)
  var payload = {
    context: _event.requestContext.path,
  }
  if(userData){
    payload['person'] = {"id": userData.uid, "username": `${userData.first_name} ${userData.last_name}`, "email": userData.email}
  }
}

// https://rollbar.com/docs/notifier/rollbar.js/#the-request-object
GlobalHandler.rollbarLambdaRequest = function(_event, _context){

  var bodyContent = _event.body;
  var contentTypeHeader = _event.headers['Content-Type'] || _event.headers['content-type'];
  if(contentTypeHeader == 'application/json'){
    //process JSON payload
    bodyContent = JSON.stringify(_event.body);
  }

  if(_event.headers && _event.headers['Host']){
    _event.headers['host'] = _event.headers['Host'];
  }

  return {
    host: _event.headers['host'],
    headers: _event.headers,
    protocol: 'https',
    url: _event.requestContext.path,
    method: _event.httpMethod,
    body: bodyContent,
    route: {path: _event.path},
  }
}




GlobalHandler.wrap = function(_handler, _handlerOptions) {
  return function(event, context, cb) {
    var self = {};
    try {
      //attach handlerOptions to this closure
      self.handler = _handler;
      self.handlerOptions = _handlerOptions || {responseType: 'standard'};

      //process event (populate event.token and event.body with JSON)
      event = GlobalHandler.processEvent(event);

      //configure a Rollbar handler
      GlobalHandler.configureRollbar(context.awsRequestId, GlobalHandler.rollbarLambdaPayload(event, context));
      self.rollbar = GlobalHandler.getRollbar(context.awsRequestId);

      //configure Google Analytics
      try {
        GlobalHandler.publishGoogleAnalyticsEvent(event, context)
      }
      catch(e){
        debug('An error occured while publishing google analytics event: %o', e)
      }

      return self.handler(event, context, function(err, resp) {
        if(err) {
          self.rollbar.error(err.message || 'unknown error', err, GlobalHandler.rollbarLambdaRequest(event))
        }
        self.rollbar.wait(function() {

          if(err && self.handlerOptions.responseType == 'catalog'){
            cb(null, GlobalHandler.catalogErrorResponse(err)) //its a handled lambda error
          }
          else if(err){
            return cb(null, GlobalHandler.standardErrorResponse(err)) //its a handled lambda error
          }
          else if (self.handlerOptions.responseType == 'catalog'){
            return cb(null, GlobalHandler.catalogResponse(resp))
          }
          else if (self.handlerOptions.responseType == 'redirect'){
            return cb(null, GlobalHandler.redirectResponse(resp))
          }
          else {
            return cb(null, GlobalHandler.standardResponse(resp))
          }

        });
      });
    } catch (err) {
      debug('An unhandled error occured inside wrapper, %o', err)
      if(self.rollbar){
        self.rollbar.error(err.message || 'unhandled error', err, GlobalHandler.rollbarLambdaRequest(event))
        self.rollbar.wait(function() {
          throw err;
        });
      }
      else {
        throw err;
      }
    }
  };
};


//create a default rollbar instance that will listen to uncaught exceptions.
GlobalHandler.configureRollbar('default', {captureUncaught: true});