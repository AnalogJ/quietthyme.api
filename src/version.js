'use strict';

module.exports.handler = (event, context, callback) => {

    var versionInfo = {
        'deploySha': process.env.DEPLOY_SHA
    }

    return callback(null, versionInfo);
};
