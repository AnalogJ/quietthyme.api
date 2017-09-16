'use strict';
const debug = require('debug')('quietthyme:version');
var nconf = require('./common/nconf');

var GlobalHandler = require('./common/global_handler');

var VersionHandler = module.exports

VersionHandler.router = GlobalHandler.wrap(function(event, context, cb) {
  debug('AuthEndpoint router event: %o', event);
  if (event.pathParameters.action == 'version' && event.httpMethod == 'GET') {
    VersionHandler.handler(event, context, cb);
  } else {
    Utilities.errorHandler(cb)(
      new Error(`Unknown API endpoint: ${event.pathParameters.action}`)
    );
  }
})


VersionHandler.handler = function(event, context, callback){
  debug(event);
  debug(nconf.get('STAGE'), nconf.get('DEPLOY_SHA'));
  var versionInfo = {
    deploySha: nconf.get('DEPLOY_SHA'),
  };
  // if (nconf.get('STAGE') == 'beta') {
  //   versionInfo.event = event
  // }

  return callback(null, versionInfo);
}
