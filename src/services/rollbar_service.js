var Rollbar = require('rollbar');
var nconf = require('../common/nconf');

var RollbarService = module.exports;

//global configuration for every call.
var _rollbar_instances = {}

var _disabled_rollbar = new Rollbar({
  enabled: false
})

//create an instance of the rollbar object.
RollbarService.get = function(requestId){
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
        server: {
          branch: nconf.get('STAGE')
        }
      }
    });
    _rollbar_instances[requestId].log(`Initialize rollbar for request ${requestId}`);
  }

  return _rollbar_instances[requestId]
}

RollbarService.configure = function(requestId, payloadData){
  var rollbar = RollbarService.get(requestId);
  rollbar.configure({payload: payloadData}); //TODO: verify that this "MERGES" with the existing payload data, instead of overwriting it.
}


//create a default rollbar instance that will listen to uncaught exceptions.
RollbarService.configure('default', {captureUncaught: true});