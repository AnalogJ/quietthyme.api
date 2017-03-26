'use strict';
const debug = require('debug')('quietthyme:version')

module.exports.handler = (event, context, callback) => {

    var versionInfo = {
        'deploySha': process.env.DEPLOY_SHA
    }

    return callback(null, versionInfo);
};
