var Rollbar = require('rollbar');
var nconf = require('./nconf');
var JwtTokenService = require('../services/jwt_token_service');
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
  event.token = "";

  var authHeader = event.headers['Authorization'];
  if(authHeader){
    var authParts = authHeader.split(' ');

    if( authParts.length == 2 ){
      event.token = authParts[1];

      //todo we could set the event.auth object here, so handlers dont need to do it individually. Have to figure out promises
      // first.
    }
  }

  var contentTypeHeader = event.headers['Content-Type'];
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
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({success: true, data: payload})
  }
}

GlobalHandler.standardErrorResponse = function(err){
  if(err == null){return null}
  return {
    statusCode: err.code || 500,
    headers:{
      'Content-Type': 'application/json'
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
    },
    body: JSON.stringify({})
  }
}




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
  var contentTypeHeader = _event.headers['Content-Type'];
  if(contentTypeHeader == 'application/json'){
    //process JSON payload
    bodyContent = JSON.stringify(event.body);
  }

  return {
    headers: _event.headers,
    protocol: 'https',
    url: _event.requestContext.path,
    method: _event.httpMethod,
    body: bodyContent,
    route: {path: _event.path},
  }
}




GlobalHandler.wrap = function(_handler, _handlerOptions) {
  var self = this;
  return function(event, context, cb) {
    try {
      //attach handlerOptions to this closure
      self.handlerOptions = _handlerOptions || {responseType: 'standard'};

      //process event (populate event.token and event.body with JSON)
      event = GlobalHandler.processEvent(event);

      //configure a Rollbar handler
      GlobalHandler.configureRollbar(context.awsRequestId, GlobalHandler.rollbarLambdaPayload(event, context));

      self.rollbar = GlobalHandler.getRollbar(context.awsRequestId);

      return _handler(event, context, function(err, resp) {
        if(err) {
          self.rollbar.error(err, GlobalHandler.rollbarLambdaRequest(event))
        }
        self.rollbar.wait(function() {

          if(!self.handlerOptions.responseType || self.handlerOptions.responseType == 'standard'){
            return cb(GlobalHandler.standardErrorResponse(err), GlobalHandler.standardResponse(resp))
          }
          else if (self.handlerOptions.responseType == 'catalog'){
            return cb(GlobalHandler.catalogErrorResponse(err), GlobalHandler.catalogResponse(resp))
          }
          else if (self.handlerOptions.responseType == 'redirect'){
            return cb(GlobalHandler.standardErrorResponse(err), GlobalHandler.redirectResponse(resp))
          }
          else {
            return cb(GlobalHandler.standardErrorResponse(err), GlobalHandler.standardResponse(resp))
          }
        });
      });
    } catch (err) {
      if(self.rollbar){
        self.rollbar.error(err, GlobalHandler.rollbarLambdaRequest(event))
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