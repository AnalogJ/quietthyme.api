'use strict';
const debug = require('debug')('quietthyme:version');
var nconf = require('./common/nconf');

var GlobalHandler = require('./common/global_handler');

var VersionHandler = module.exports

VersionHandler.router = GlobalHandler.wrap(VersionHandler.handler)


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
