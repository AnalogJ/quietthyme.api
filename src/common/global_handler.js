var Rollbar = require('rollbar');
var nconf = require('./nconf');

//global configuration for every call.
var _rollbar_instances = {}

var _disabled_rollbar = new Rollbar({
  enabled: false
})


var GlobalHandler = module.exports

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Serverless Lambda Proxy
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

GlobalHandler.processEvent = function(event){
  event.token = "";

  var authHeader = event.headers['Authorization'];
  if(authHeader){
    var authParts = authHeader.split(' ');

    if( authParts.size() == 2 ){
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
  return {
    statusCode: 200,
    body: JSON.stringify({success: true, data: payload})
  }
}

GlobalHandler.standardErrorResponse = function(err){
  return {
    statusCode: err.code || 500,
    body: JSON.stringify({success: false, error: err})
  }
}

GlobalHandler.catalogResponse = function(payload){

}

GlobalHandler.catalogErrorResponse = function(payload){

}

GlobalHandler.redirectResponse = function(redirectData){
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
  return {
    context: `${_context.logGroupName}|${_context.logStreamName}`,
    person: {"id": "123", "username": "foo", "email": "foo@example.com"}
  }
}

// https://rollbar.com/docs/notifier/rollbar.js/#the-request-object
GlobalHandler.rollbarLambdaRequest = function(_event, _context){

}




GlobalHandler.wrap = function(handler) {
  var self = this;
  return function(event, context, cb) {
    self.lambdaContext = context;
    try {
      return handler(event, context, function(err, resp) {
        if (err) {
          self.error(err);
        }
        self.wait(function() {
          cb(err, resp);
        });
      });
    } catch (err) {
      self.error(err);
      self.wait(function() {
        throw err;
      });
    }
  };
};


//create a default rollbar instance that will listen to uncaught exceptions.
GlobalHandler.configureRollbar('default', {captureUncaught: true});